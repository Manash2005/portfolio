import express from "express";
import { getLeetCodeCalendar } from "../controllers/leetcodeController.js";

const router = express.Router();

router.get("/:username", getLeetCodeCalendar);

export default router;