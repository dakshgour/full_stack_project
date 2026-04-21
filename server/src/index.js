import { env } from './config/env.js';
import { createApp } from './app.js';
import { createRepositories } from './repositories/index.js';

const repositories = await createRepositories();
const app = createApp(repositories);

app.listen(env.port, () => {
  console.log(`DSA Visualizer API listening on http://localhost:${env.port}`);
});
