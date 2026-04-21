import { createDatabasePool } from '../config/database.js';
import { createMemoryRepositories } from './memoryRepository.js';
import { createMySqlRepositories } from './mysqlRepository.js';

export async function createRepositories() {
  const pool = await createDatabasePool();
  const repos = pool ? createMySqlRepositories(pool) : createMemoryRepositories();
  if (repos.progress) {
    repos.progress._codes = repos.codes;
    repos.progress._executions = repos.executions;
    repos.progress._visualizations = repos.visualizations;
  }
  return repos;
}
