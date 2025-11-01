import { Pool, PoolConfig } from "pg";
import { databaseConfig } from "../config/config";
import logger from "../config/logger";

const connectionPoolOptions: PoolConfig = {
  user: databaseConfig.user,
  password: databaseConfig.password,
  host: databaseConfig.host,
  port: databaseConfig.port,
  database: databaseConfig.database,
};

const pool = new Pool(connectionPoolOptions);

export const testConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT NOW()");
    client.release();
    logger.info("Database Connection Established", {
      timestamp: result.rows[0].now,
      host: databaseConfig.host,
      database: databaseConfig.database,
    });
    return true;
  } catch (error) {
    logger.error("Database Connection Failed!", {
      error: error instanceof Error ? error.message : "Unknown error",
      host: databaseConfig.host,
      database: databaseConfig.database,
    });
    return false;
  }
};

/**
 * Execute a query with parameters
 * @param text - SQL query string
 * @param params - Query parameters
 * @returns Query result
 */
export const query = async <T = any>(
  text: string,
  params?: any[]
): Promise<T[]> => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug("Executed query", {
      query: text.substring(0, 100), // Truncate long queries
      duration: `${duration}ms`,
      rows: result.rowCount,
    });
    return result.rows;
  } catch (error) {
    logger.error("Query error", {
      query: text.substring(0, 100),
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
};

/**
 * Execute a single query and return the first row
 * @param text - SQL query string
 * @param params - Query parameters
 * @returns First row or null
 */
export const queryOne = async <T = any>(
  text: string,
  params?: any[]
): Promise<T | null> => {
  const rows = await query<T>(text, params);
  return rows.length > 0 ? rows[0] : null;
};

/**
 * Execute multiple queries in a transaction
 * @param callback - Callback function that receives a client for transaction queries
 * @returns Result from the callback
 */
export const transaction = async <T = any>(
  callback: (client: any) => Promise<T>
): Promise<T> => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    logger.debug("Transaction committed successfully");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    logger.error("Transaction rolled back", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Execute an INSERT query and return the inserted row
 * @param text - SQL INSERT query string
 * @param params - Query parameters
 * @returns Inserted row
 */
export const insert = async <T = any>(
  text: string,
  params?: any[]
): Promise<T> => {
  const query = text.includes("RETURNING") ? text : `${text} RETURNING *`;
  const result = await queryOne<T>(query, params);
  if (!result) {
    throw new Error("Insert operation failed");
  }
  return result;
};

/**
 * Execute an UPDATE query and return the updated row(s)
 * @param text - SQL UPDATE query string
 * @param params - Query parameters
 * @returns Updated row(s)
 */
export const update = async <T = any>(
  text: string,
  params?: any[]
): Promise<T[]> => {
  const sql = text.includes("RETURNING") ? text : `${text} RETURNING *`;
  return await query<T>(sql, params);
};

/**
 * Execute a DELETE query and return the deleted row(s)
 * @param text - SQL DELETE query string
 * @param params - Query parameters
 * @returns Deleted row(s)
 */
export const deleteQuery = async <T = any>(
  text: string,
  params?: any[]
): Promise<T[]> => {
  const sql = text.includes("RETURNING") ? text : `${text} RETURNING *`;
  return await query<T>(sql, params);
};

export default pool;
