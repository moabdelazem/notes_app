import { NextFunction, Request, Response } from "express";
import AppError from "../models/AppError";
import { appConfig } from "../config/config";
import logger from "../config/logger";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Default error values
  let statusCode = 500;
  let message = "Internal Server Error";
  let isOperational = false;

  // Check if it's our custom AppError
  if (err instanceof AppError) {
    statusCode = err.status;
    message = err.message;
    isOperational = err.isOperational;
  } else if (err.name === "ValidationError") {
    // Handle validation errors
    statusCode = 400;
    message = err.message;
  } else if (err.name === "CastError") {
    // Handle database cast errors
    statusCode = 400;
    message = "Invalid data format";
  }

  // Log error with Winston (structured logging)
  const errorLog = {
    message: err.message,
    status: statusCode,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("user-agent"),
    timestamp: new Date().toISOString(),
    isOperational,
    ...(appConfig.nodeEnv === "development" && { stack: err.stack }),
  };

  // Use appropriate log level based on status code
  if (statusCode >= 500) {
    logger.error("Server Error", errorLog);
  } else if (statusCode >= 400) {
    logger.warn("Client Error", errorLog);
  } else {
    logger.info("Error", errorLog);
  }

  // Send error response
  res.status(statusCode).json({
    status: "error",
    message: message,
    ...(appConfig.nodeEnv === "development" && {
      stack: err.stack,
      error: err,
    }),
    isOperational,
  });
};
