import mongoose from 'mongoose'

const GoalSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    category: { type: String, default: 'AI Engineering' },
    status: { type: String, enum: ['planned', 'in_progress', 'completed'], default: 'in_progress' },
    target_date: { type: String, default: '' },
    color: { type: String, default: '#B8FF3C' },
    created_at: { type: String, default: () => new Date().toISOString() },
    updated_at: { type: String, default: () => new Date().toISOString() },
  },
  {
    collection: 'goals',
    timestamps: false,
    versionKey: false,
  }
)

export const GoalModel = mongoose.models.Goal || mongoose.model('Goal', GoalSchema)
