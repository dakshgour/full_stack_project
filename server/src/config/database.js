import mysql from 'mysql2/promise';
import { env } from './env.js';

export async function createDatabasePool() {
  if (env.mysqlUrl) {
    return mysql.createPool(env.mysqlUrl);
  }

  if (!env.mysqlHost || !env.mysqlUser || !env.mysqlDatabase) {
    return null;
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
