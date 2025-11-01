import express from "express";
import morgan from "morgan";
import cors from "cors";
import { appConfig } from "./config/config";
import router from "./routes";
import { errorHandler } from "./middlewares/errorHandler";
import helmet from "helmet";
import compression from "compression";
import { morganStream } from "./config/logger";

const app = express();
const isDevelopment = appConfig.nodeEnv == "development";

// middlewares
app.use(express.json());

// HTTP request logging with Morgan + Winston
app.use(
  morgan(
    isDevelopment
      ? "dev"
      : ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms',
    { stream: morganStream }
  )
);
app.use(helmet());
app.use(compression());

// CORS Configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, Postman, or curl)
      if (!origin) {
        return callback(null, true);
      }

      // Check if origin is in allowed list
      if (appConfig.allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true, // Allow cookies and authorization headers
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
    maxAge: 600, // Cache preflight requests for 10 minutes
  })
);

app.get("/health", (req, res) => {
  const response = {
    status: "Ok",
    uptime: process.uptime(),
  };
  res.status(200);
  res.send(response);
});

app.use("/api/", router);

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    status: "error",
    message: `Cannot ${req.method} ${req.originalUrl} - Route not found`,
    path: req.originalUrl,
    method: req.method,
  });
});

// Global Error Handler Middleware
app.use(errorHandler);

export default app;
