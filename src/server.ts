import app from "./app";
import { appConfig } from "./config/config";
import { testConnection } from "./database/db";
import logger from "./config/logger";

const appPort = appConfig.port;
const appEnvironment = appConfig.nodeEnv;

app.listen(appPort, async () => {
  logger.info("Server starting...", {
    author: "@moabdelazem",
    port: appPort,
    environment: appEnvironment.toUpperCase(),
    nodeVersion: process.version,
    timestamp: new Date().toISOString(),
  });

  // Test database connection
  const dbConnected = await testConnection();

  if (dbConnected) {
    logger.info("Application ready to accept connections", {
      port: appPort,
      environment: appEnvironment,
    });
  } else {
    logger.error("Application started but database connection failed");
  }
});
