import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import { MIME_TYPES, projectRoot, WS_PATH } from '../const/index.js';

function safeJoin(base, target) {
  const targetPath = path.posix.normalize('/' + target).replace(/^\/+/, '');
  const resolved = path.resolve(base, targetPath);
  if (!resolved.startsWith(base + path.sep) && resolved !== base) {
    throw new Error('Invalid path');
  }
  return resolved;
}

export function createHttpServer() {
  return http.createServer(async (req, res) => {
    try {
      if (!req.url) {
        res.writeHead(400);
        res.end('Bad Request');
        return;
      }

      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      let pathname = url.pathname;

      if (pathname === WS_PATH) {
        res.writeHead(426);
        res.end('Upgrade Required');
        return;
      }

      if (pathname === '/rooms') pathname = '/rooms.html';
      if (pathname.startsWith('/room/')) {
        pathname = '/room.html';
      }
      if (pathname === '/') pathname = '/index.html';

      const filePath = safeJoin(projectRoot, pathname);
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      const content = await fs.readFile(filePath);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } catch {
      res.writeHead(404);
      res.end('Not Found');
    }
  });
};
