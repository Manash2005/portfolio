import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import codingActivityRoutes from "./routes/codingActivityRoutes.js";
import leetcodeRoutes from "./routes/leetcodeRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import secondBrainRoutes from "./routes/secondBrainRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import dsaRoutes from "./routes/dsaRoutes.js";
import blogRoutes from "./routes/blogRoutes.js";
import { pruneStaleCalendarRevisions } from "./services/dsaMasteryService.js";
import { getHeatmapActivity } from "./controllers/secondBrainController.js";
import { getPortfolioContent, getPublicProjects } from "./controllers/adminController.js";
import { autoProvisionFromEnv } from "./db/provisionAdmin.js";
import { connectMongo } from "./db/mongo.js";
import { syncMongoAndSqlite } from "./db/mongoPersistence.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());

const isDev = (process.env.NODE_ENV || "production") === "development";

const allowedOrigins = isDev
  ? [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:3000",
      "http://localhost",
    ]
  : [
      "https://manashswain.vercel.app",
      "https://portfolio-c43c.onrender.com",
    ];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (isDev) {
      if (origin.startsWith("http://localhost:") || origin === "http://localhost") {
        return callback(null, true);
      }
    }

    if (
      allowedOrigins.indexOf(origin) !== -1 ||
      origin.endsWith(".vercel.app") ||
      origin.endsWith(".onrender.com")
    ) {
      return callback(null, true);
    }

    console.warn(`CORS blocked origin: ${origin}`);
    return callback(null, false);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "x-admin-token",
  ],
  credentials: true,
  optionsSuccessStatus: 204,
  maxAge: 86400,
};

app.use(cors(corsOptions));

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && (origin.endsWith(".vercel.app") || origin.endsWith(".onrender.com"))) {
    res.header("Access-Control-Allow-Origin", origin);
  } else if (isDev) {
    if (origin) {
      res.header("Access-Control-Allow-Origin", origin);
    } else {
      res.header("Access-Control-Allow-Origin", "*");
    }
  }
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-admin-token"
  );
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

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

// Second Brain & Activity APIs
app.use("/api/v1/leetcode", leetcodeRoutes);
app.use("/api/v1/coding-activity", codingActivityRoutes);
app.use("/api/v1/contact", contactRoutes);
app.use("/api/v1/second-brain", secondBrainRoutes);
app.use("/api/v1/dsa", dsaRoutes);
app.use("/api/v1/blogs", blogRoutes);
app.get("/api/portfolio/activity", getHeatmapActivity);

// Portfolio Public Dynamic APIs
app.get("/api/portfolio/content", getPortfolioContent);
app.get("/api/portfolio/projects", getPublicProjects);

// Administrator Authentication & Management APIs
app.use("/api/v1/admin/auth", authRoutes);
app.use("/api/v1/admin", adminRoutes);

// Ensure default admin user is initialized
autoProvisionFromEnv();

// Clean up any stale planned revision dates in calendar
try {
  pruneStaleCalendarRevisions();
} catch (pruneErr) {
  console.warn("Calendar revision prune warning:", pruneErr.message);
}

// Initialize MongoDB Atlas connection & cloud hydration
connectMongo()
  .then(() => syncMongoAndSqlite())
  .catch((err) => {
    console.error("[MongoDB Startup Error]", err.message);
  });

const PORT = process.env.PORT || 8000;

const server = app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use by another process. If another server instance is running, terminate it or change PORT.`);
    process.exit(1);
  } else {
    console.error("Server error:", error);
  }
});