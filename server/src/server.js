import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import codingActivityRoutes from "./routes/codingActivityRoutes.js";
import leetcodeRoutes from "./routes/leetcodeRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";

dotenv.config();

const app = express();

app.use(express.json());

const allowedOrigins = process.env.NODE_ENV === "development" 
  ? ["http://localhost:5173", "http://localhost:3000"]
  : ["https://your-production-url.com"];

app.use(
  cors({
    origin: allowedOrigins,
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
app.use("/api/v1/coding-activity",codingActivityRoutes);
app.use("/api/v1/contact", contactRoutes);

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});