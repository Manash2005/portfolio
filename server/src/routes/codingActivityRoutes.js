import express from "express";
import {
  getCodingActivity,
} from "../controllers/codingActivityController.js";

const router = express.Router();

router.get("/", getCodingActivity);

export default router;