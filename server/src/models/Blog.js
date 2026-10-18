import mongoose from 'mongoose'

const BlogSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    original_url: { type: String, required: true },
    original_author: { type: String, default: '' },
    published_date: { type: String, default: '' },
    topic: { type: String, default: 'Engineering' },
    subtopics: { type: [String], default: [] },
    summary: { type: String, default: '' },
    cover_image: { type: String, default: '' },
    reading_time_minutes: { type: Number, default: 5 },
    content_json: { type: mongoose.Schema.Types.Mixed, default: [] },
    key_takeaways: { type: [String], default: [] },
    raw_markdown: { type: String, default: '' },
    is_published: { type: Number, default: 1 },
    created_at: { type: String, default: () => new Date().toISOString() },
    updated_at: { type: String, default: () => new Date().toISOString() },
  },
  {
    collection: 'blogs',
    timestamps: false,
    versionKey: false,
  }
)

BlogSchema.index({ topic: 1 })
BlogSchema.index({ is_published: 1, created_at: -1 })

export const BlogModel = mongoose.models.Blog || mongoose.model('Blog', BlogSchema)
