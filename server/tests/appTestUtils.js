import { createApp } from '../src/app.js';
import { createMemoryRepositories } from '../src/repositories/memoryRepository.js';

export function makeTestApp() {
  const repositories = createMemoryRepositories();
  repositories.progress._codes = repositories.codes;
  repositories.progress._executions = repositories.executions;
  repositories.progress._visualizations = repositories.visualizations;
  return { app: createApp(repositories), repositories };
}
