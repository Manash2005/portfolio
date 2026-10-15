import { useMemo } from 'react'
import { Zap, CheckCircle2, Trophy, Flame, Target, ArrowRight } from 'lucide-react'

/**
 * Deterministic pseudo-random generator seeded by date string (YYYY-MM-DD).
 * Ensures daily challenges are identical for all requests on the same day,
 * but rotate automatically every single midnight.
 */
function getDaySeed(dateStr) {
  let hash = 0
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

/**
 * Available daily challenge pool
 */
const QUEST_POOL = [
  {
    id: 'solve_3_easy',
    title: 'Warmup Calibration',
    desc: 'Solve 3 Easy problems to sharpen pattern intuition',
    target: 3,
    xp: 20,
    check: (attempt) => attempt.difficulty === 'Easy' && attempt.result === 'solved',
  },
  {
    id: 'solve_1_hard_independent',
    title: 'Ironclad Algorithmic Master',
    desc: 'Solve 1 Hard problem completely independently without assistance',
    target: 1,
    xp: 50,
    check: (attempt) => attempt.difficulty === 'Hard' && attempt.result === 'solved' && attempt.is_independent === 1,
  },
  {
    id: 'solve_2_medium_independent',
    title: 'Core Interview Gauntlet',
    desc: 'Solve 2 Medium problems independently',
    target: 2,
    xp: 40,
    check: (attempt) => attempt.difficulty === 'Medium' && attempt.result === 'solved' && attempt.is_independent === 1,
  },
  {
    id: 'spaced_repetition_review',
    title: 'Spaced Memory Lock',
    desc: 'Complete 1 Spaced Repetition review problem',
    target: 1,
    xp: 25,
    check: (attempt) => attempt.result === 'solved' && Boolean(attempt.next_revision_due),
  },
  {
    id: 'speed_demon',
    title: 'Rapid Solution Sprint',
    desc: 'Solve 1 problem in under 15 minutes',
    target: 1,
    xp: 30,
    check: (attempt) => attempt.result === 'solved' && attempt.duration_seconds && attempt.duration_seconds <= 900,
  },
  {
    id: 'high_focus_session',
    title: 'Deep Focus Execution',
    desc: 'Log at least 35 minutes of active problem-solving time today',
    target: 1,
    xp: 35,
    isAggregateTime: true,
  },
]

export default function DailyXpQuests({ recentAttempts = [], onSelectTopic }) {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])

  // Generate today's 3 distinct quests deterministically
  const dailyQuests = useMemo(() => {
    const seed = getDaySeed(todayStr)
    const quests = []
    const available = [...QUEST_POOL]

    for (let i = 0; i < 3; i++) {
      const idx = (seed + i * 7) % available.length
      quests.push(available.splice(idx, 1)[0])
    }
    return quests
  }, [todayStr])

  // Filter attempts logged today
  const todayAttempts = useMemo(() => {
    return recentAttempts.filter((a) => {
      if (!a.created_at) return false
      const aDate = a.created_at.includes('T') ? a.created_at.split('T')[0] : a.created_at.split(' ')[0]
      return aDate === todayStr
    })
  }, [recentAttempts, todayStr])

  // Compute progress for each quest
  const questStatus = useMemo(() => {
    const todayTotalSeconds = todayAttempts.reduce((acc, a) => acc + (a.duration_seconds || 0), 0)

    return dailyQuests.map((q) => {
      let current = 0
      if (q.isAggregateTime) {
        current = todayTotalSeconds >= 2100 ? 1 : 0
      } else {
        current = todayAttempts.filter(q.check).length
      }

      const completed = current >= q.target
      return {
        ...q,
        current: Math.min(current, q.target),
        completed,
      }
    })
  }, [dailyQuests, todayAttempts])

  const totalDailyXpAvailable = dailyQuests.reduce((acc, q) => acc + q.xp, 0)
  const earnedTodayXp = questStatus.filter((q) => q.completed).reduce((acc, q) => acc + q.xp, 0)

  return (
    <div className="p-6 rounded-3xl border border-hairline bg-[#0E0E14] text-left flex flex-col gap-5 shadow-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-hairline pb-4">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-accent/15 text-accent">
            <Zap className="w-5 h-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-display font-bold text-white">
                Daily XP Missions & Challenges
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent/20 text-accent font-bold uppercase tracking-wider">
                Rotates Daily
              </span>
            </div>
            <p className="text-xs font-mono text-muted">
              Complete today's algorithmic objectives to unlock tiered bonus XP points.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#12121A] border border-hairline text-xs font-mono">
            <Trophy className="w-3.5 h-3.5 text-accent" />
            <span className="text-muted">Earned:</span>
            <span className="text-accent font-bold">
              +{earnedTodayXp} / {totalDailyXpAvailable} XP
            </span>
          </div>
        </div>
      </div>

      {/* Quest Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {questStatus.map((quest) => {
          const percent = Math.round((quest.current / quest.target) * 100)

          return (
            <div
              key={quest.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3.5 ${
                quest.completed
                  ? 'border-accent/40 bg-[#121815] shadow-sm'
                  : 'border-white/5 bg-[#12121A] hover:border-white/15'
              }`}
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                      quest.completed
                        ? 'bg-accent text-[#08080C]'
                        : 'bg-accent/15 text-accent border border-accent/30'
                    }`}
                  >
                    +{quest.xp} XP
                  </span>

                  <span className="text-[11px] font-mono text-muted font-medium">
                    {quest.current} / {quest.target}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-display font-bold text-white flex items-center gap-1.5">
                    {quest.completed && <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />}
                    <span>{quest.title}</span>
                  </h4>
                  <p className="text-xs font-mono text-muted mt-1 leading-relaxed">
                    {quest.desc}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="flex flex-col gap-1.5 pt-1">
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-muted">
                  <span>{percent}% Complete</span>
                  {quest.completed ? (
                    <span className="text-accent font-semibold">Completed ✓</span>
                  ) : (
                    <span>In Progress</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
