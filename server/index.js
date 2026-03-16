import 'dotenv/config';
import { WebSocketServer } from 'ws';
import { rooms } from './services/RoomsState/index.js';
import { createHttpServer } from './services/createHttpServer.js';
import { authenticateWsRequest } from './services/auth/wsAuth.js';
 
const PORT = Number(process.env.PORT || 3000);
const WS_PATH = '/ws';
const WS_UNAUTHORIZED_CLOSE_CODE = 4001;

const server = createHttpServer();

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

wss.on('connection', (ws, req) => {
  const auth = authenticateWsRequest(req);

  if (!auth?.id) {
    ws.close(WS_UNAUTHORIZED_CLOSE_CODE, 'Unauthorized');
    return;
  }

  ws.auth = auth;

  // rooms snapshot
  ws.send(JSON.stringify({
    type: 'ROOMS_SNAPSHOT',
    rooms: rooms.getRoomsSnapshot(),
  }));
  
  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (!msg || typeof msg !== 'object') return;
      if (typeof msg.type !== 'string') return;

      const actorId = ws.auth?.id;
      if (!actorId) return;

      switch (msg.type) {
        /* ---------- ROOMS (STUBS) ---------- */

        case 'ROOM_CREATE': {
          rooms.createRoom({
            name: msg.name,
            ownerId: actorId,
            isPublic: true,
          });

          broadcastAll({
            type: 'ROOMS_SNAPSHOT',
            rooms: rooms.getRoomsSnapshot()
          });
          return;
        }

        case 'ROOM_JOIN': {
          const room = rooms.getRoom(msg.roomId);
          if (!room) return;
          if (!room.canJoin(actorId)) return;

          room.addPeer({
            id: actorId,
            role: actorId === room.ownerId ? 'owner' : 'editor',
            metadata: {
              email: ws.auth.email,
              displayName: ws.auth.displayName,
            },
          });

          ws.send(JSON.stringify({
            type: 'ROOM_JOINED',
            roomId: msg.roomId,
            ...room.graph.getGraphSnapshot(),
          }));
          return;
        }

        /* ---------- GRAPH ---------- */

        case 'NODE_MOVE': {
          if (typeof msg.x !== 'number' || typeof msg.y !== 'number') return;
          const room = rooms.getRoom(msg.roomId);
          if (!room) return;
          if (!room.moveNode(actorId, msg)) return;
          broadcast(ws, { ...msg, userId: actorId });
          return;
        }
        case 'NODE_CREATE': {
          if (!msg.node || typeof msg.node !== 'object') return;
          const room = rooms.getRoom(msg.roomId);
          if (!room) return;
          if (!room.createNode(actorId, msg)) return;
          broadcast(ws, { ...msg, userId: actorId });
          return;
        }
        case 'NODE_CONTENT': {
          if (typeof msg.content !== 'string') return;
          const room = rooms.getRoom(msg.roomId);
          if (!room) return;
          if (!room.updateNodeContent(actorId, msg)) return;
          broadcast(ws, { ...msg, userId: actorId });
          return;
        }
        case 'NODE_TYPE': {
          if (typeof msg.nodeId !== 'number') return;
          if (msg.nodeType !== null && typeof msg.nodeType !== 'string') return;
          const room = rooms.getRoom(msg.roomId);
          if (!room) return;
          if (!room.updateNodeType(actorId, msg)) return;
          broadcast(ws, { ...msg, userId: actorId });
          return;
        }
        case 'NODE_DELETE': {
          if (typeof msg.nodeId !== 'number') return;
          const room = rooms.getRoom(msg.roomId);
          if (!room) return;
          if (!room.deleteNode(actorId, msg)) return;
          broadcast(ws, { ...msg, userId: actorId });
          return;
        }
        case 'LINK_CREATE': {
          if (typeof msg.source !== 'number' || typeof msg.target !== 'number') return;
          const room = rooms.getRoom(msg.roomId);
          if (!room) return;
          if (!room.createLink(actorId, msg)) return;
          broadcast(ws, { ...msg, userId: actorId });
          return;
        }
        case 'LINK_DELETE': {
          if (typeof msg.source !== 'number' || typeof msg.target !== 'number') return;
          const room = rooms.getRoom(msg.roomId);
          if (!room) return;
          if (!room.deleteLink(actorId, msg)) return;
          broadcast(ws, { ...msg, userId: actorId });
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
