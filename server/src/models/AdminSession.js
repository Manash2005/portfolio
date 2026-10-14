import mongoose from 'mongoose'

const SessionSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    id: { type: String, required: true, unique: true },
    user_id: { type: String, required: true, ref: 'AdminUser' },
    session_token: { type: String, required: true, unique: true },
    expires_at: { type: String, required: true },
    created_at: { type: String, default: () => new Date().toISOString() },
    last_active_at: { type: String, default: () => new Date().toISOString() },
  },
  {
    collection: 'sessions',
    timestamps: false,
    versionKey: false,
  }
)

SessionSchema.index({ expires_at: 1 })

export const SessionModel = mongoose.models.Session || mongoose.model('Session', SessionSchema)

const LoginAttemptSchema = new mongoose.Schema(
  {
    ip: { type: String, required: true },
    attempt_time: { type: Number, required: true },
  },
  {
    collection: 'login_attempts',
    timestamps: false,
    versionKey: false,
  }
)

LoginAttemptSchema.index({ ip: 1, attempt_time: 1 })

export const LoginAttemptModel = mongoose.models.LoginAttempt || mongoose.model('LoginAttempt', LoginAttemptSchema)
