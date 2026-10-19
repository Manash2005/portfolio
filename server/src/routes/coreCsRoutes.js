import express from 'express'
import {
  listCards,
  getCardById,
  getDrillDeck,
  submitReview,
  listCheatSheets,
  getStats,
  createCustomCard,
  deleteCustomCard,
  listCourses,
  getCourseCurriculum,
  getLesson,
  submitLessonAssignment,
} from '../controllers/coreCsController.js'
import { requireAdmin } from '../middleware/authMiddleware.js'

const router = express.Router()

// Interactive Course Academy
router.get('/courses', listCourses)
router.get('/courses/:identifier', getCourseCurriculum)
router.get('/lessons/:id', getLesson)
router.post('/lessons/:id/submit-assignment', submitLessonAssignment)

// Card catalog & search
router.get('/cards', listCards)
router.get('/cards/:id', getCardById)

// Active recall drill & SM-2 review
router.get('/drill', getDrillDeck)
router.post('/review', submitReview)

// Pre-interview cheat sheets & stats
router.get('/cheat-sheets', listCheatSheets)
router.get('/stats', getStats)

// Custom cards management
router.post('/cards', requireAdmin, createCustomCard)
router.delete('/cards/:id', requireAdmin, deleteCustomCard)

export default router
