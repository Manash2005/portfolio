import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import leetcodeRoutes from "./routes/leetcodeRoutes.js";

dotenv.config();

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: "*",
  })
);

app.get("/", (req, res) => {
  res.send("Server Running");
});
app.get("/test", async (req, res) => {
  try {
    const response = await fetch("https://leetcode.com");

    res.json({
      success: true,
      status: response.status,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

app.use("/api/v1/leetcode", leetcodeRoutes);

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});