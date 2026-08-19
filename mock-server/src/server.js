import { createApp } from './app.js';
import { config } from './config.js';

const app = createApp();

const server = app.listen(config.port, config.host, () => {
  console.log(`[mock-server] listening on http://${config.host}:${config.port} (env=${config.env})`);
});

const shutdown = (signal) => {
  console.log(`[mock-server] ${signal} received, shutting down`);
  server.close(() => process.exit(0));
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
