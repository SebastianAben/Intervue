import { env } from './config/env.js';
import { createApp } from './app.js';

const app = createApp();
const host = '0.0.0.0';

app.listen(env.PORT, host, () => {
  console.log(`Intervue API listening on http://${host}:${env.PORT}/api`);
});
