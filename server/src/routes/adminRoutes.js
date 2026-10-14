import express from 'express'
import { requireAdmin } from '../middleware/authMiddleware.js'
import {
  getAdminProjects,
  createProject,
  updateProject,
  deleteProject,
  getAdminEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  updatePortfolioContent,
} from '../controllers/adminController.js'

const router = express.Router()

// All routes here strictly require admin authentication
router.use(requireAdmin)

// Projects
router.get('/projects', getAdminProjects)
router.post('/projects', createProject)
router.patch('/projects/:id', updateProject)
router.delete('/projects/:id', deleteProject)

// Events (including private notes and draft/private events)
router.get('/events', getAdminEvents)
router.post('/events', createEvent)
router.patch('/events/:id', updateEvent)
router.delete('/events/:id', deleteEvent)

// Portfolio Content Sections
router.patch('/content/:section', updatePortfolioContent)

export default router
