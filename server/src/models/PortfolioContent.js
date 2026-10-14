import mongoose from 'mongoose'

const PortfolioContentSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    section_key: { type: String, required: true, unique: true },
    content_json: { type: mongoose.Schema.Types.Mixed, required: true },
    updated_at: { type: String, default: () => new Date().toISOString() },
  },
  {
    collection: 'portfolio_content',
    timestamps: false,
    versionKey: false,
  }
)

export const PortfolioContentModel = mongoose.models.PortfolioContent || mongoose.model('PortfolioContent', PortfolioContentSchema)
