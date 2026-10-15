import { db } from '../db/database.js'
import crypto from 'node:crypto'
import { getDeterministicPracticePlan, getTopicMasteryStats, getRevisionQueue } from './dsaMasteryService.js'
import { getMistakeAnalytics } from './dsaMistakeService.js'
import { persistDailyPlanToMongo } from '../db/mongoPersistence.js'

// In-memory key state tracker for cooldowns
const keyCoolDowns = new Map() // keyHash -> cooldownUntilTimestamp
const inFlightRequests = new Set() // prevent duplicate clicks

function getCleanKeys(envVarValue) {
  if (!envVarValue) return []
  return envVarValue
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean)
}

function getKeyHash(key) {
  return crypto.createHash('sha256').update(key).digest('hex').slice(0, 12)
}

function getUsableKey(keys) {
  const now = Date.now()
  for (const k of keys) {
    const hash = getKeyHash(k)
    const cooldown = keyCoolDowns.get(hash) || 0
    if (now >= cooldown) {
      return k
    }
  }
  return null
}

function markKeyCooling(key, cooldownMs = 60000) {
  const hash = getKeyHash(key)
  keyCoolDowns.set(hash, Date.now() + cooldownMs)
}

/**
 * Log AI request to SQLite audit table without sensitive info
 */
function logAiRequest({ action, provider, model, prompt_summary, response_json, latency_ms, success, error_category }) {
  try {
    const id = crypto.randomUUID()
    db.prepare(`
      INSERT INTO dsa_ai_logs (
        id, action, provider, model, prompt_summary, response_json, latency_ms, success, error_category
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      action,
      provider,
      model || null,
      prompt_summary ? prompt_summary.slice(0, 500) : null,
      response_json ? JSON.stringify(response_json).slice(0, 2000) : null,
      latency_ms || 0,
      success ? 1 : 0,
      error_category || null
    )
  } catch (err) {
    console.warn('Could not write AI log:', err)
  }
}

/**
 * Build compact contextual summary from SQLite for the LLM
 */
function buildCoachContext(durationBudgetMinutes = 45) {
  const topicStats = getTopicMasteryStats()
  const revisionData = getRevisionQueue()
  const mistakeData = getMistakeAnalytics()

  // Get sample of available catalog problems across different topics (max 20 to keep prompt compact)
  const availableProblems = db.prepare(`
    SELECT id, title, difficulty, primary_topic, estimated_solve_time
    FROM dsa_problems
    WHERE is_free = 1
    ORDER BY RANDOM()
    LIMIT 25
  `).all()

  // Recent attempts
  const recentAttempts = db.prepare(`
    SELECT a.result, a.is_independent, a.duration_seconds, p.title, p.primary_topic, p.difficulty
    FROM dsa_attempts a
    JOIN dsa_problems p ON a.problem_id = p.id
    ORDER BY a.created_at DESC
    LIMIT 5
  `).all()

  return {
    durationBudgetMinutes,
    weakTopics: topicStats.weakTopics.map(t => `${t.topic} (${t.masteryScore}% mastery)`),
    dueRevisions: revisionData.overdue.concat(revisionData.dueToday).slice(0, 5).map(r => ({
      id: r.problem_id,
      title: r.title,
      topic: r.primary_topic,
      difficulty: r.difficulty,
    })),
    topMistakePattern: mistakeData.topPattern ? `${mistakeData.topPattern.label} (${mistakeData.topPattern.count} times)` : 'None recorded',
    recentActivity: recentAttempts.map(a => `${a.title} (${a.difficulty}) - ${a.result} [independent: ${a.is_independent}]`),
    availableProblems,
  }
}

/**
 * Execute LLM call with Groq
 */
async function callGroq(prompt, keys, model = 'llama-3.3-70b-versatile') {
  const startTime = Date.now()
  for (let attempt = 0; attempt < keys.length; attempt++) {
    const key = getUsableKey(keys)
    if (!key) break

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: `You are an elite, practical DSA training coach.
You MUST output valid, parseable JSON only. Do not include markdown codeblocks, conversational filler, or commentary.
Your JSON must strictly match this structure:
{
  "summary": "Concise strategy explanation",
  "estimated_total_minutes": 45,
  "recommendations": [
    {
      "problem_id": "exact-problem-id-from-context",
      "reason": "Specific learning rationale",
      "activity_type": "revision" | "weak_topic_practice" | "new_problem",
      "priority": "high" | "medium",
      "estimated_minutes": 20
    }
  ]
}
CRITICAL: You MUST only choose problem_id values that exist in the provided Available Problems or Due Revisions lists. Never invent IDs.`,
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.2,
          max_tokens: 1000,
          response_format: { type: 'json_object' },
        }),
        signal: AbortSignal.timeout(15000),
      })

      if (response.status === 429) {
        console.warn('[AI Coach] Groq rate limited (429). Rotating key.')
        markKeyCooling(key, 60000)
        continue
      }

      if (!response.ok) {
        const errText = await response.text()
        console.warn(`[AI Coach] Groq error ${response.status}:`, errText)
        if (response.status === 401 || response.status === 403) {
          markKeyCooling(key, 300000) // invalid key
        }
        continue
      }

      const data = await response.json()
      const rawContent = data.choices?.[0]?.message?.content
      const parsed = JSON.parse(rawContent)
      return {
        success: true,
        data: parsed,
        provider: 'groq',
        model,
        latency_ms: Date.now() - startTime,
      }
    } catch (err) {
      console.warn('[AI Coach] Groq fetch exception:', err.message)
      markKeyCooling(key, 30000)
    }
  }

  return { success: false, provider: 'groq', latency_ms: Date.now() - startTime }
}

/**
 * Execute LLM call with OpenRouter
 */
async function callOpenRouter(prompt, keys, model = 'meta-llama/llama-3.1-8b-instruct:free') {
  const startTime = Date.now()
  for (let attempt = 0; attempt < keys.length; attempt++) {
    const key = getUsableKey(keys)
    if (!key) break

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
          'HTTP-Referer': 'https://portfolio.local',
          'X-Title': 'DSA Training Arena',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: `You are a practical DSA training mentor. Return valid JSON only with summary, estimated_total_minutes, and recommendations array. Every problem_id must come from the provided list.`,
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.2,
          max_tokens: 1000,
        }),
        signal: AbortSignal.timeout(18000),
      })

      if (response.status === 429) {
        console.warn('[AI Coach] OpenRouter rate limited (429). Rotating key.')
        markKeyCooling(key, 60000)
        continue
      }

      if (!response.ok) {
        const errText = await response.text()
        console.warn(`[AI Coach] OpenRouter error ${response.status}:`, errText)
        if (response.status === 401 || response.status === 403) {
          markKeyCooling(key, 300000)
        }
        continue
      }

      const data = await response.json()
      const rawContent = data.choices?.[0]?.message?.content
      // Clean JSON if model wrapped in ```json
      const cleanJson = rawContent.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim()
      const parsed = JSON.parse(cleanJson)
      return {
        success: true,
        data: parsed,
        provider: 'openrouter',
        model,
        latency_ms: Date.now() - startTime,
      }
    } catch (err) {
      console.warn('[AI Coach] OpenRouter fetch exception:', err.message)
      markKeyCooling(key, 30000)
    }
  }

  return { success: false, provider: 'openrouter', latency_ms: Date.now() - startTime }
}

/**
 * Validate LLM recommendations against SQLite database
 * Replaces hallucinated or missing IDs with verified problems from database
 */
function validateAndEnrichRecommendations(rawRecommendations, durationBudgetMinutes) {
  if (!Array.isArray(rawRecommendations) || rawRecommendations.length === 0) {
    return null
  }

  const enrichedItems = []
  let totalMinutes = 0

  for (const item of rawRecommendations) {
    if (!item.problem_id) continue

    // Verify against SQLite
    const problem = db.prepare('SELECT * FROM dsa_problems WHERE id = ?').get(item.problem_id)
    if (problem) {
      const minutes = item.estimated_minutes || problem.estimated_solve_time || 20
      enrichedItems.push({
        problem_id: problem.id,
        title: problem.title,
        platform: problem.platform,
        difficulty: problem.difficulty,
        primary_topic: problem.primary_topic,
        canonical_url: problem.canonical_url,
        activity_type: item.activity_type || 'practice',
        reason: item.reason || 'Recommended by DSA coach based on topic mastery.',
        priority: item.priority || 'medium',
        estimated_minutes: minutes,
      })
      totalMinutes += minutes
    }
  }

  // If the model hallucinated all IDs, return null to trigger deterministic fallback
  if (enrichedItems.length === 0) {
    return null
  }

  return {
    items: enrichedItems,
    totalMinutes,
  }
}

/**
 * Generate Practice Plan on demand (STRICTLY user-triggered)
 */
export async function generatePracticePlan({ durationBudgetMinutes = 45 } = {}) {
  const reqId = `plan-${durationBudgetMinutes}`
  if (inFlightRequests.has(reqId)) {
    throw new Error('A practice plan generation is already in progress. Please wait a moment.')
  }
  inFlightRequests.add(reqId)

  try {
    const context = buildCoachContext(durationBudgetMinutes)
    const prompt = `
Time budget: ${durationBudgetMinutes} minutes.
Weak topics: ${context.weakTopics.join(', ') || 'None identified yet'}.
Problems Due for Revision: ${JSON.stringify(context.dueRevisions)}.
Recurring Mistake: ${context.topMistakePattern}.
Recent attempts: ${context.recentActivity.join(', ') || 'No attempts yet'}.
Available Problems Catalog (pick only from these IDs):
${JSON.stringify(context.availableProblems.map(p => ({ id: p.id, title: p.title, difficulty: p.difficulty, topic: p.primary_topic, estTime: p.estimated_solve_time })))}

Recommend 2-3 problems that fit the ${durationBudgetMinutes}-minute budget. Prioritize due revisions and weak topics. Use exact IDs from above.
`

    const groqKeys = getCleanKeys(process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY)
    const openRouterKeys = getCleanKeys(process.env.OPENROUTER_API_KEYS || process.env.OPENROUTER_API_KEY)

    let result = null

    // 1. Try Groq first if keys configured
    if (groqKeys.length > 0) {
      result = await callGroq(prompt, groqKeys)
    }

    // 2. Try OpenRouter if Groq was not configured or failed
    if ((!result || !result.success) && openRouterKeys.length > 0) {
      result = await callOpenRouter(prompt, openRouterKeys)
    }

    // 3. Check and validate LLM output against SQLite
    if (result && result.success && result.data) {
      const validated = validateAndEnrichRecommendations(result.data.recommendations, durationBudgetMinutes)
      if (validated) {
        const plan = {
          plan_date: new Date().toISOString().split('T')[0],
          duration_budget_minutes: durationBudgetMinutes,
          estimated_total_minutes: validated.totalMinutes,
          summary: result.data.summary || `AI curated ${validated.totalMinutes}-min practice session.`,
          generated_by: `ai_${result.provider}`,
          items: validated.items,
          fallback: false,
        }

        // Audit log
        logAiRequest({
          action: 'daily_plan',
          provider: result.provider,
          model: result.model,
          prompt_summary: `Budget: ${durationBudgetMinutes}m, Items: ${validated.items.length}`,
          response_json: plan,
          latency_ms: result.latency_ms,
          success: true,
        })

        // Persist daily plan in SQLite & MongoDB Atlas
        const planId = crypto.randomUUID()
        db.prepare(`
          INSERT INTO dsa_daily_plans (id, plan_date, duration_budget_minutes, summary, items_json, generated_by)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(planId, plan.plan_date, plan.duration_budget_minutes, plan.summary, JSON.stringify(plan.items), plan.generated_by)

        persistDailyPlanToMongo({
          id: planId,
          plan_date: plan.plan_date,
          duration_budget_minutes: plan.duration_budget_minutes,
          summary: plan.summary,
          items_json: JSON.stringify(plan.items),
          generated_by: plan.generated_by,
        }).catch(() => {})

        return { ...plan, id: planId }
      }
    }

    // 4. Fallback to deterministic recommendation engine
    console.info('[AI Coach] LLM unavailable or hallucinated IDs. Using deterministic practice plan.')
    const fallbackPlan = getDeterministicPracticePlan(durationBudgetMinutes)

    logAiRequest({
      action: 'daily_plan',
      provider: 'deterministic_fallback',
      prompt_summary: `Budget: ${durationBudgetMinutes}m (deterministic)`,
      response_json: fallbackPlan,
      latency_ms: 5,
      success: true,
      error_category: result ? 'llm_output_rejected' : 'no_llm_keys',
    })

    const planId = crypto.randomUUID()
    db.prepare(`
      INSERT INTO dsa_daily_plans (id, plan_date, duration_budget_minutes, summary, items_json, generated_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(planId, fallbackPlan.plan_date, fallbackPlan.duration_budget_minutes, fallbackPlan.summary, JSON.stringify(fallbackPlan.items), 'deterministic')

    persistDailyPlanToMongo({
      id: planId,
      plan_date: fallbackPlan.plan_date,
      duration_budget_minutes: fallbackPlan.duration_budget_minutes,
      summary: fallbackPlan.summary,
      items_json: JSON.stringify(fallbackPlan.items),
      generated_by: 'deterministic',
    }).catch(() => {})

    return {
      ...fallbackPlan,
      id: planId,
      fallback: true,
      fallback_note: 'Generated using deterministic spaced repetition & topic mastery rules (no external AI call).',
    }
  } finally {
    inFlightRequests.delete(reqId)
  }
}

/**
 * Analyze Weak Topics and provide targeted advice
 */
export async function analyzeWeaknesses() {
  const reqId = 'weakness-analysis'
  if (inFlightRequests.has(reqId)) {
    throw new Error('Analysis already in progress.')
  }
  inFlightRequests.add(reqId)

  try {
    const topicStats = getTopicMasteryStats()
    const mistakeData = getMistakeAnalytics()
    const context = {
      weakTopics: topicStats.weakTopics,
      topMistakes: mistakeData.categoryCounts.slice(0, 3),
    }

    // Deterministic fallback response structure
    const fallbackAnalysis = {
      weakTopicsSummary: topicStats.weakTopics.length > 0
        ? `Identified ${topicStats.weakTopics.length} topic(s) requiring attention: ${topicStats.weakTopics.map(t => t.topic).join(', ')}.`
        : 'All practiced topics are currently maintaining satisfactory mastery levels.',
      actionableAdvice: topicStats.weakTopics.slice(0, 3).map(t => ({
        topic: t.topic,
        score: t.masteryScore,
        recommendation: `Complete at least 2 independent solves in ${t.topic} to improve retention.`,
      })),
      topMistakeNote: mistakeData.topPattern
        ? `Primary error category is "${mistakeData.topPattern.label}". Double-check corner cases before submitting.`
        : 'Keep logging mistake journal reflections after challenging sessions.',
      provider: 'deterministic',
    }

    const groqKeys = getCleanKeys(process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY)
    if (groqKeys.length === 0) {
      return fallbackAnalysis
    }

    const prompt = `
Analyze these DSA weakness metrics and provide concise, high-impact coach guidance:
Weak Topics: ${JSON.stringify(context.weakTopics.map(t => ({ topic: t.topic, score: t.masteryScore, needsRevision: t.needsRevision })))}
Mistake Categories: ${JSON.stringify(context.topMistakes)}

Output JSON only with keys: weakTopicsSummary (string), actionableAdvice (array of { topic, recommendation }), topMistakeNote (string).
`
    const res = await callGroq(prompt, groqKeys)
    if (res.success && res.data) {
      return { ...res.data, provider: 'groq' }
    }

    return fallbackAnalysis
  } finally {
    inFlightRequests.delete(reqId)
  }
}
