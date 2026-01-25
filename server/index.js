import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';
import { graphState } from './graphState/index.js';
import { Room } from './roomState/room.js';
 
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const PORT = Number(process.env.PORT || 3000);
const WS_PATH = '/ws';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

function safeJoin(base, target) {
  const targetPath = path.posix.normalize('/' + target).replace(/^\/+/, '');
  const resolved = path.resolve(base, targetPath);
  if (!resolved.startsWith(base + path.sep) && resolved !== base) {
    throw new Error('Invalid path');
  }
  return resolved;
}

const server = http.createServer(async (req, res) => {
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

const wss = new WebSocketServer({ server, path: WS_PATH });

function broadcast(sender, obj) {
  const payload = JSON.stringify(obj);
  for (const client of wss.clients) {
    if (client.readyState !== 1) continue;
    if (client === sender) continue;
    client.send(payload);
  }
}
function broadcastAll(obj) {
  const payload = JSON.stringify(obj);
  for (const client of wss.clients) {
    if (client.readyState !== 1) continue;
    client.send(payload);
  }
}
const rooms = new Map();

// Optional optimization (only if you have MANY clients)
// create cache variable and update cache function on room creation
function getRoomsSnapshot() {
  return [...rooms.values()].map(room => ({
    id: room.id,
    name: room.name
  }));
}
let nextRoomId = 10000;
wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'GRAPH', ...graphState.getGraphSnapshot() }));

  // rooms snapshot
  ws.send(JSON.stringify({
    type: 'ROOMS_SNAPSHOT',
    rooms: getRoomsSnapshot(),
  }));
  
  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (!msg || typeof msg !== 'object') return;
      if (typeof msg.type !== 'string') return;

      switch (msg.type) {
        /* ---------- ROOMS (STUBS) ---------- */

        case 'ROOM_CREATE': {
          if (typeof msg.name !== 'string') return;

          const room = new Room({
            id: nextRoomId++,
            name: msg.name,
            isPublic: true,
            ownerId: msg.userId,
          });

          rooms.set(room.id, room);
          broadcastAll({
            type: 'ROOMS_SNAPSHOT',
            rooms: getRoomsSnapshot()
          });
          return;
        }

        case 'ROOM_JOIN': {
          if (typeof msg.id !== 'number') return;
          const room = rooms.get(msg.id);
          if (!room) return;
          if (!room.canJoin(msg.userId)) return;

          room.addPeer({
            id: msg.userId,
            name: 'Peer',
          });

          console.log('PEERS', [...room.peers.values()].map(peer => peer.id));

          // stub: no real join logic yet
          ws.send(JSON.stringify({
            type: 'ROOM_JOINED',
            id: msg.id
          }));
          return;
        }

        /* ---------- GRAPH ---------- */

        case 'NODE_MOVE': {
          if (typeof msg.id !== 'number') return;
          if (typeof msg.x !== 'number' || typeof msg.y !== 'number') return;
          if (!graphState.applyNodeMove(msg)) return;
          broadcast(ws, msg);
          return;
        }
        case 'NODE_CREATE': {
          if (!msg.node || typeof msg.node !== 'object') return;
          if (!graphState.applyNodeCreate(msg)) return;
          broadcast(ws, msg);
          return;
        }
        case 'NODE_CONTENT': {
          if (typeof msg.id !== 'number') return;
          if (typeof msg.content !== 'string') return;
          if (!graphState.applyNodeContent(msg)) return;
          broadcast(ws, msg);
          return;
        }
        default:
          return;
      }
    } catch {
      return;
    }
  });
});

server.listen(PORT, () => {
  console.log(`HTTP server listening on http://localhost:${PORT}`);
  console.log(`WebSocket server listening on ws://localhost:${PORT}${WS_PATH}`);
});
