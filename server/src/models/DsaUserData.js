import mongoose from 'mongoose'

// 1. Practice Attempts Model
const DsaAttemptSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    id: { type: String, required: true, unique: true },
    problem_id: { type: String, required: true, index: true },
    attempt_number: { type: Number, default: 1 },
    started_at: { type: String, default: null },
    ended_at: { type: String, default: null },
    duration_seconds: { type: Number, default: null },
    result: { type: String, required: true, enum: ['solved', 'attempted_unsolved', 'timed_out', 'abandoned', 'reviewed'] },
    is_independent: { type: Number, default: 1 },
    hints_used: { type: Number, default: 0 },
    solution_viewed: { type: Number, default: 0 },
    language: { type: String, default: 'Java' },
    confidence_rating: { type: Number, default: 3 },
    difficulty_experienced: { type: String, default: 'medium' },
    notes: { type: String, default: '' },
    source: { type: String, default: 'practice_arena' },
    xp_awarded: { type: Number, default: 0 },
    calendar_event_id: { type: String, default: null },
    created_at: { type: String, default: () => new Date().toISOString() },
  },
  {
    collection: 'dsa_attempts',
    timestamps: false,
    versionKey: false,
  }
)

DsaAttemptSchema.index({ problem_id: 1, result: 1 })
DsaAttemptSchema.index({ created_at: -1 })

export const DsaAttemptModel =
  mongoose.models.DsaAttempt || mongoose.model('DsaAttempt', DsaAttemptSchema)

// 2. Spaced Repetition Revision Schedule Model
const DsaRevisionScheduleSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    problem_id: { type: String, required: true, unique: true },
    last_solved_at: { type: String, required: true },
    next_revision_due: { type: String, required: true, index: true },
    interval_days: { type: Number, default: 3 },
    repetition_count: { type: Number, default: 1 },
    ease_factor: { type: Number, default: 2.5 },
    status: { type: String, default: 'due', enum: ['due', 'upcoming', 'mastered'] },
    updated_at: { type: String, default: () => new Date().toISOString() },
  },
  {
    collection: 'dsa_revision_schedule',
    timestamps: false,
    versionKey: false,
  }
)

export const DsaRevisionScheduleModel =
  mongoose.models.DsaRevisionSchedule ||
  mongoose.model('DsaRevisionSchedule', DsaRevisionScheduleSchema)

// 3. Mistake Journal Model
const DsaMistakeJournalSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    id: { type: String, required: true, unique: true },
    problem_id: { type: String, required: true, index: true },
    attempt_id: { type: String, default: null },
    category: { type: String, required: true },
    mistake_description: { type: String, required: true },
    lesson_learned: { type: String, default: '' },
    created_at: { type: String, default: () => new Date().toISOString() },
  },
  {
    collection: 'dsa_mistake_journal',
    timestamps: false,
    versionKey: false,
  }
)

export const DsaMistakeJournalModel =
  mongoose.models.DsaMistakeJournal ||
  mongoose.model('DsaMistakeJournal', DsaMistakeJournalSchema)

// 4. Game Profile Model (XP, streaks, rank)
const DsaGameProfileSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true, default: 'primary_user' },
    id: { type: String, required: true, unique: true, default: 'primary_user' },
    total_xp: { type: Number, default: 0 },
    current_level: { type: String, default: 'Novice' },
    current_streak: { type: Number, default: 0 },
    longest_streak: { type: Number, default: 0 },
    last_active_date: { type: String, default: null },
    streak_freeze_count: { type: Number, default: 2 },
    penalties_enabled: { type: Number, default: 0 },
    created_at: { type: String, default: () => new Date().toISOString() },
    updated_at: { type: String, default: () => new Date().toISOString() },
  },
  {
    collection: 'dsa_game_profile',
    timestamps: false,
    versionKey: false,
  }
)

export const DsaGameProfileModel =
  mongoose.models.DsaGameProfile ||
  mongoose.model('DsaGameProfile', DsaGameProfileSchema)

// 5. Achievement Unlocks Model
const DsaAchievementUnlockSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    id: { type: String, required: true, unique: true }, // achievement id e.g. 'first_solve'
    is_unlocked: { type: Number, default: 1 },
    unlocked_at: { type: String, default: () => new Date().toISOString() },
  },
  {
    collection: 'dsa_achievement_unlocks',
    timestamps: false,
    versionKey: false,
  }
)

export const DsaAchievementUnlockModel =
  mongoose.models.DsaAchievementUnlock ||
  mongoose.model('DsaAchievementUnlock', DsaAchievementUnlockSchema)

// 6. Daily Plans Model
const DsaDailyPlanSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    id: { type: String, required: true, unique: true },
    plan_date: { type: String, required: true, index: true },
    duration_budget_minutes: { type: Number, default: 45 },
    summary: { type: String, default: '' },
    items_json: { type: String, default: '[]' },
    generated_by: { type: String, default: 'deterministic' },
    status: { type: String, default: 'active' },
    calendar_event_id: { type: String, default: null },
    created_at: { type: String, default: () => new Date().toISOString() },
  },
  {
    collection: 'dsa_daily_plans',
    timestamps: false,
    versionKey: false,
  }
)

export const DsaDailyPlanModel =
  mongoose.models.DsaDailyPlan ||
  mongoose.model('DsaDailyPlan', DsaDailyPlanSchema)
