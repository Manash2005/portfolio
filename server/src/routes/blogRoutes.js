import express from 'express'
import {
  listBlogs,
  getBlogTopics,
  getBlogBySlug,
  importBlog,
  deleteBlog,
} from '../controllers/blogController.js'
import { requireAdmin } from '../middleware/authMiddleware.js'

const router = express.Router()

// Public read endpoints
router.get('/', listBlogs)
router.get('/topics', getBlogTopics)
router.get('/:identifier', getBlogBySlug)

// Admin management endpoints
router.post('/import', requireAdmin, importBlog)
router.delete('/:id', requireAdmin, deleteBlog)

export default router
