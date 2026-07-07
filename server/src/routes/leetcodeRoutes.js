import express from "express";
import { getLeetCodeCalendar, getLeetCodeStats } from "../controllers/leetcodeController.js";

const router = express.Router();

router.get("/:username", getLeetCodeCalendar);
router.get("/stats/:username", getLeetCodeStats);

export default router;