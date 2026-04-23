import dotenv from 'dotenv';

dotenv.config({ path: process.env.DOTENV_CONFIG_PATH || '../.env' });
dotenv.config();

function numberFromEnv(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: numberFromEnv(process.env.PORT, 4000),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'development-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  mysqlUrl: process.env.MYSQL_URL || '',
  mysqlHost: process.env.MYSQL_HOST || '',
  mysqlPort: numberFromEnv(process.env.MYSQL_PORT, 3306),
  mysqlUser: process.env.MYSQL_USER || '',
  mysqlPassword: process.env.MYSQL_PASSWORD || '',
  mysqlDatabase: process.env.MYSQL_DATABASE || 'dsa_visualizer',
  maxCodeLength: numberFromEnv(process.env.MAX_CODE_LENGTH, 12000),
  maxInputLength: numberFromEnv(process.env.MAX_INPUT_LENGTH, 2000),
  executionTimeoutMs: numberFromEnv(process.env.EXECUTION_TIMEOUT_MS, 2000),
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: numberFromEnv(process.env.SMTP_PORT, 587),
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  smtpFrom: process.env.SMTP_FROM || '',
};

export function isProduction() {
  return env.nodeEnv === 'production';
}
