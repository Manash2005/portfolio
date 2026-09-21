import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import codingActivityRoutes from "./routes/codingActivityRoutes.js";
import leetcodeRoutes from "./routes/leetcodeRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";

dotenv.config();

const app = express();

app.use(express.json());

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
  ],
  credentials: true,
  optionsSuccessStatus: 204,
  maxAge: 86400,
};

app.use(cors(corsOptions));

app.options("(.*)", cors(corsOptions));

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && (origin.endsWith(".vercel.app") || origin.endsWith(".onrender.com"))) {
    res.header("Access-Control-Allow-Origin", origin);
  } else if (isDev) {
    res.header("Access-Control-Allow-Origin", "*");
  }
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
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

app.use("/api/v1/leetcode", leetcodeRoutes);
app.use("/api/v1/coding-activity",codingActivityRoutes);
app.use("/api/v1/contact", contactRoutes);

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});