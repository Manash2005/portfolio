import mongoose from 'mongoose'

const EventSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    category: { type: String, default: 'Learning' },
    start_at: { type: String, required: true },
    end_at: { type: String, required: true },
    all_day: { type: Number, default: 0 },
    timezone: { type: String, default: 'Asia/Kolkata' },
    location: { type: String, default: '' },
    meeting_url: { type: String, default: '' },
    external_url: { type: String, default: '' },
    status: { type: String, default: 'Planned' },
    visibility: { type: String, enum: ['Public', 'Private'], default: 'Private' },
    show_on_portfolio_heatmap: { type: Number, default: 0 },
    color: { type: String, default: null },
    tags: { type: [String], default: [] },
    priority: { type: String, default: 'medium' },
    goal_id: { type: String, default: null },
    project_id: { type: String, default: null },
    private_notes: { type: String, default: '' }, // Strictly private notes, never returned in public API
    created_at: { type: String, default: () => new Date().toISOString() },
    updated_at: { type: String, default: () => new Date().toISOString() },
  },
  {
    collection: 'events',
    timestamps: false,
    versionKey: false,
  }
)

EventSchema.index({ start_at: 1, end_at: 1 })
EventSchema.index({ visibility: 1 })
EventSchema.index({ category: 1 })
EventSchema.index({ status: 1 })
EventSchema.index({ goal_id: 1 })
EventSchema.index({ project_id: 1 })

export const EventModel = mongoose.models.Event || mongoose.model('Event', EventSchema)
