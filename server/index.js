import dotenv from 'dotenv';
dotenv.config();
import { WebSocketServer } from 'ws';
import { rooms } from './services/RoomsState/index.js';
import { createHttpServer } from './services/createHttpServer.js';
 
const PORT = Number(process.env.PORT || 3000);
const WS_PATH = '/ws';

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

wss.on('connection', (ws) => {
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

      switch (msg.type) {
        /* ---------- ROOMS (STUBS) ---------- */

        case 'ROOM_CREATE': {
          rooms.createRoom({
            name: msg.name,
            ownerId: msg.userId,
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
          if (!room.canJoin(msg.userId)) return;

          room.addPeer({
            id: msg.userId,
            name: 'Peer',
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
          if (!room.moveNode(msg.userId, msg)) return;
          broadcast(ws, msg);
          return;
        }
        case 'NODE_CREATE': {
          if (!msg.node || typeof msg.node !== 'object') return;
          const room = rooms.getRoom(msg.roomId);
          if (!room) return;
          if (!room.createNode(msg.userId, msg)) return;
          broadcast(ws, msg);
          return;
        }
        case 'NODE_CONTENT': {
          if (typeof msg.content !== 'string') return;
          const room = rooms.getRoom(msg.roomId);
          if (!room) return;
          if (!room.updateNodeContent(msg.userId, msg)) return;
          broadcast(ws, msg);
          return;
        }
        case 'NODE_TYPE': {
          if (typeof msg.nodeId !== 'number') return;
          if (msg.nodeType !== null && typeof msg.nodeType !== 'string') return;
          const room = rooms.getRoom(msg.roomId);
          if (!room) return;
          if (!room.updateNodeType(msg.userId, msg)) return;
          broadcast(ws, msg);
          return;
        }
        case 'NODE_DELETE': {
          if (typeof msg.nodeId !== 'number') return;
          const room = rooms.getRoom(msg.roomId);
          if (!room) return;
          if (!room.deleteNode(msg.userId, msg)) return;
          broadcast(ws, msg);
          return;
        }
        case 'LINK_CREATE': {
          if (typeof msg.source !== 'number' || typeof msg.target !== 'number') return;
          const room = rooms.getRoom(msg.roomId);
          if (!room) return;
          if (!room.createLink(msg.userId, msg)) return;
          broadcast(ws, msg);
          return;
        }
        case 'LINK_DELETE': {
          if (typeof msg.source !== 'number' || typeof msg.target !== 'number') return;
          const room = rooms.getRoom(msg.roomId);
          if (!room) return;
          if (!room.deleteLink(msg.userId, msg)) return;
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
