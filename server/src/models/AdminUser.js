import mongoose from 'mongoose'

const AdminUserSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    id: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
    salt: { type: String, required: true },
    created_at: { type: String, default: () => new Date().toISOString() },
    updated_at: { type: String, default: () => new Date().toISOString() },
  },
  {
    collection: 'admin_users',
    timestamps: false,
    versionKey: false,
  }
)

export const AdminUserModel = mongoose.models.AdminUser || mongoose.model('AdminUser', AdminUserSchema)
