import mongoose from 'mongoose'

const DsaProblemSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    id: { type: String, required: true, unique: true },
    platform: { type: String, required: true, enum: ['leetcode', 'geeksforgeeks', 'interviewbit', 'hackerrank', 'other'], default: 'leetcode' },
    platform_problem_id: { type: String, default: null },
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    canonical_url: { type: String, required: true },
    difficulty: { type: String, required: true, enum: ['Easy', 'Medium', 'Hard'] },
    primary_topic: { type: String, required: true },
    secondary_topics: { type: [String], default: [] },
    patterns: { type: [String], default: [] },
    is_free: { type: Number, default: 1 },
    access_status: { type: String, default: 'free' },
    estimated_solve_time: { type: Number, default: 25 },
    acceptance_rate: { type: Number, default: null },
    source: { type: String, default: 'curated_catalog' },
    created_at: { type: String, default: () => new Date().toISOString() },
    updated_at: { type: String, default: () => new Date().toISOString() },
  },
  {
    collection: 'dsa_problems',
    timestamps: false,
    versionKey: false,
  }
)

DsaProblemSchema.index({ primary_topic: 1 })
DsaProblemSchema.index({ difficulty: 1 })
DsaProblemSchema.index({ platform: 1 })
DsaProblemSchema.index({ is_free: 1 })

export const DsaProblemModel = mongoose.models.DsaProblem || mongoose.model('DsaProblem', DsaProblemSchema)
