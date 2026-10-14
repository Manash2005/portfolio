import mongoose from 'mongoose'

const ProjectSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    short_description: { type: String, default: '' },
    outcome: { type: String, default: '' },
    problem: { type: String, default: '' },
    architecture: { type: String, default: '' },
    key_challenge: { type: String, default: '' },
    solution: { type: String, default: '' },
    metrics: { type: [String], default: [] },
    category: { type: String, default: 'AI / Automation' },
    status: { type: String, enum: ['planned', 'active', 'completed'], default: 'active' },
    tech_stack: { type: [String], default: [] },
    live_link: { type: String, default: '' },
    github_link: { type: String, default: '' },
    image: { type: String, default: '' },
    featured: { type: Number, default: 0 },
    reflection: { type: String, default: '' },
    is_published: { type: Number, default: 1 },
    display_order: { type: Number, default: 0 },
    goal_id: { type: String, default: null },
    created_at: { type: String, default: () => new Date().toISOString() },
    updated_at: { type: String, default: () => new Date().toISOString() },
  },
  {
    collection: 'projects',
    timestamps: false,
    versionKey: false,
  }
)

ProjectSchema.index({ is_published: 1, display_order: 1 })
ProjectSchema.index({ goal_id: 1 })

export const ProjectModel = mongoose.models.Project || mongoose.model('Project', ProjectSchema)
