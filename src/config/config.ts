import dotenv from "dotenv";
import { z } from "zod";

/**
 * Load environment variables from .env file
 * Expected variables:
 * - PORT: Application port (default: 6767)
 * - NODE_ENV: Environment (development|production|test, default: development)
 * - ALLOWED_ORIGINS: Comma-separated list of allowed CORS origins (default: http://localhost:3000)
 * - DATABASE_USER: PostgreSQL username (required)
 * - DATABASE_PASSWORD: PostgreSQL password (required)
 * - DATABASE_HOST: PostgreSQL host (default: localhost)
 * - DATABASE_PORT: PostgreSQL port (default: 5432)
 * - DATABASE_NAME: PostgreSQL database name (required)
 */
dotenv.config({ quiet: true });

const appConfigSchema = z.object({
  port: z.number().int().default(6767),
  nodeEnv: z.enum(["development", "production", "test"]).default("development"),
  allowedOrigins: z.array(z.string()).default(["http://localhost:3000"]),
});

const databaseConfigSchema = z.object({
  user: z.string().min(1, "Database user is required"),
  password: z.string().min(1, "Database password is required"),
  host: z.string().default("localhost"),
  port: z.number().int().positive().default(5432),
  database: z.string().min(1, "Database name is required"),
});

// Parse and validate application config
const parseAppConfig = () => {
  try {
    // Parse allowed origins from comma-separated string
    const allowedOrigins = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
      : undefined;

    return appConfigSchema.parse({
      port: process.env.PORT ? Number(process.env.PORT) : undefined,
      nodeEnv: process.env.NODE_ENV,
      allowedOrigins,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Invalid application configuration:");
      console.error(error.issues);
    }
    throw new Error(
      `Application configuration validation failed: ${
        error instanceof z.ZodError
          ? error.issues
              .map((e) => `${e.path.join(".")}: ${e.message}`)
              .join(", ")
          : "Unknown error"
      }`
    );
  }
};

// Parse and validate database config
const parseDatabaseConfig = () => {
  try {
    return databaseConfigSchema.parse({
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      host: process.env.DATABASE_HOST,
      port: process.env.DATABASE_PORT
        ? Number(process.env.DATABASE_PORT)
        : undefined,
      database: process.env.DATABASE_NAME,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Invalid database configuration:");
      console.error(error.issues);
    }
    throw new Error(
      `Database configuration validation failed: ${
        error instanceof z.ZodError
          ? error.issues
              .map((e) => `${e.path.join(".")}: ${e.message}`)
              .join(", ")
          : "Unknown error"
      }`
    );
  }
};

export const appConfig = parseAppConfig();
export const databaseConfig = parseDatabaseConfig();

export type AppConfig = z.infer<typeof appConfigSchema>;
export type DatabaseConfig = z.infer<typeof databaseConfigSchema>;

export default {
  app: appConfig,
  database: databaseConfig,
};
