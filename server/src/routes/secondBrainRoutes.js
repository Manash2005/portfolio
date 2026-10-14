import express from 'express'
import {
  getPublicEvents,
  getEventById,
  getUpcomingEvents,
  getRecentActivity,
  getGoals,
  getProjects,
  getStatistics,
  getHeatmapActivity,
  getActivityEvents,
} from '../controllers/secondBrainController.js'

const router = express.Router()

// Public Read-Only Second Brain Endpoints
router.get('/events', getPublicEvents)
router.get('/events/:id', getEventById)
router.get('/upcoming', getUpcomingEvents)
router.get('/recent', getRecentActivity)
router.get('/goals', getGoals)
router.get('/projects', getProjects)
router.get('/statistics', getStatistics)
router.get('/heatmap', getHeatmapActivity)
router.get('/activity-events', getActivityEvents)

export default router
