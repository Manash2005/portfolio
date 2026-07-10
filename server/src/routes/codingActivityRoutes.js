import express from "express";
import {
  getCodingActivity,
  getDatavidhyaStats,
} from "../controllers/codingActivityController.js";

const router = express.Router();

router.get("/", getCodingActivity);
router.get("/datavidhya-stats/:userId", getDatavidhyaStats);

export default router;