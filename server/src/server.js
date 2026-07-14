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
  ? ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"]
  : ["https://manashswain.vercel.app"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl)
      if (!origin) return callback(null, true);

      if (process.env.NODE_ENV === "development") {
        if (origin.startsWith("http://localhost:") || origin === "http://localhost") {
          return callback(null, true);
        }
      }

      // Allow production domain and Vercel preview domains
      if (
        allowedOrigins.indexOf(origin) !== -1 ||
        origin.endsWith(".vercel.app")
      ) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
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