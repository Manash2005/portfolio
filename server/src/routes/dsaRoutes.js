import express from 'express'
import {
  getDsaOverview,
  listProblems,
  getProblem,
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
} from '../controllers/dsaController.js'
import { requireAdmin, optionalAdmin } from '../middleware/authMiddleware.js'

const router = express.Router()

// Public / Semi-public catalog routes with optional admin enrichment
router.get('/problems', optionalAdmin, listProblems)
router.get('/problems/:id', optionalAdmin, getProblem)
router.get('/topics', optionalAdmin, getTopicMastery)

// Private dashboard, history, practice, and AI coach routes (strict admin auth)
router.get('/overview', requireAdmin, getDsaOverview)
router.get('/revision', requireAdmin, getRevisionList)
router.post('/attempts', requireAdmin, createAttempt)
router.get('/mistakes', requireAdmin, listMistakes)
router.post('/mistakes', requireAdmin, createMistake)
router.post('/ai/practice-plan', requireAdmin, generateAiPracticePlan)
router.post('/ai/analyze-weaknesses', requireAdmin, getAiWeaknessAnalysis)
router.post('/sync/leetcode', requireAdmin, syncLeetCode)
router.post('/catalog/import', requireAdmin, importCatalog)
router.post('/penalties/toggle', requireAdmin, updatePenalties)

export default router
