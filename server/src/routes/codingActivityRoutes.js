import express from "express";
import {
  getCodingActivity,
  getGithubStats,
  getGithubHeatmap,
  getLeetcodeCalendar,
  getGfgCalendar,
} from "../controllers/codingActivityController.js";

const router = express.Router();

router.get("/", getCodingActivity);
router.get("/github-stats/:username", getGithubStats);
router.get("/github-heatmap/:username", getGithubHeatmap);
router.get("/leetcode-calendar/:username", getLeetcodeCalendar);
router.get("/leetcode-calendar", getLeetcodeCalendar);
router.get("/gfg-calendar/:username", getGfgCalendar);
router.get("/gfg-calendar", getGfgCalendar);

export default router;