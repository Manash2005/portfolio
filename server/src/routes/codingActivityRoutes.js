import express from "express";
import {
  getCodingActivity,
  getGithubStats,
  getGithubHeatmap,
} from "../controllers/codingActivityController.js";

const router = express.Router();

router.get("/", getCodingActivity);
router.get("/github-stats/:username", getGithubStats);
router.get("/github-heatmap/:username", getGithubHeatmap);

export default router;