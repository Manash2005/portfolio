import express from 'express'
import {
  getDsaOverview,
  listProblems,
  getProblem,
  createProblem,
  createAttempt,
  getTopicMastery,
  getRevisionList,
  createMistake,
  listMistakes,
  generateAiPracticePlan,
  getAiWeaknessAnalysis,
  syncLeetCode,
  importCatalog,
  updatePenalties,
  syncRevisionsCalendarController,
} from '../controllers/dsaController.js'
import { requireAdmin, optionalAdmin } from '../middleware/authMiddleware.js'

const router = express.Router()

// Public / Semi-public catalog routes with optional admin enrichment
router.get('/problems', optionalAdmin, listProblems)
router.get('/problems/:id', optionalAdmin, getProblem)
router.post('/problems', requireAdmin, createProblem)
router.get('/topics', optionalAdmin, getTopicMastery)

// Overview, revision queue, and mistakes allow optionalAdmin so public showcase is visible without 401s
router.get('/overview', optionalAdmin, getDsaOverview)
router.get('/revision', optionalAdmin, getRevisionList)
router.get('/mistakes', optionalAdmin, listMistakes)

// Mutation routes strictly require admin auth
router.post('/attempts', requireAdmin, createAttempt)
router.post('/mistakes', requireAdmin, createMistake)
router.post('/ai/practice-plan', requireAdmin, generateAiPracticePlan)
router.post('/ai/analyze-weaknesses', requireAdmin, getAiWeaknessAnalysis)
router.post('/sync/leetcode', requireAdmin, syncLeetCode)
router.post('/catalog/import', requireAdmin, importCatalog)
router.post('/penalties/toggle', requireAdmin, updatePenalties)
router.post('/revision/sync-calendar', requireAdmin, syncRevisionsCalendarController)

export default router
