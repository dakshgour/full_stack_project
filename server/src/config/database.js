import { env } from './env.js';

export async function createDatabasePool() {
  const hasUrl = Boolean(env.mysqlUrl);
  const hasDiscreteConfig = Boolean(env.mysqlHost && env.mysqlUser && env.mysqlDatabase);
  if (!hasUrl && !hasDiscreteConfig) {
    return null;
  }

  const mysql = await import('mysql2/promise');

  if (hasUrl) {
    return mysql.createPool(env.mysqlUrl);
  }

  return mysql.createPool({
    host: env.mysqlHost,
    port: env.mysqlPort,
    user: env.mysqlUser,
    password: env.mysqlPassword,
    database: env.mysqlDatabase,
    waitForConnections: true,
    connectionLimit: 10,
  });
}
