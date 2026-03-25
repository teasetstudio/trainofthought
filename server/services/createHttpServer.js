import http from 'http';
import express from 'express';
import path from 'path';
import { projectRoot, WS_PATH } from '../const/index.js';
import { createAuthRouter } from './auth/routes.js';

function sendPage(res, fileName) {
  res.sendFile(path.join(projectRoot, fileName));
}

export function createHttpServer() {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json());

  app.use('/api/auth', createAuthRouter());

  app.get(WS_PATH, (_req, res) => {
    res.status(426).send('Upgrade Required');
  });

  app.get('/', (_req, res) => {
    sendPage(res, 'index.html');
  });

  app.use(express.static(projectRoot));

  app.get('/{*path}', (_req, res) => {
    sendPage(res, 'index.html');
  });

  return http.createServer(app);
}
