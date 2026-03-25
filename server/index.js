import 'dotenv/config';
import { WebSocketServer } from 'ws';
import { rooms } from './services/RoomsState/index.js';
import { createHttpServer } from './services/createHttpServer.js';
import { authenticateWsRequest } from './services/auth/wsAuth.js';
import { prisma } from './services/prisma.js';
 
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

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function parseInviteEmails(rawInviteEmails) {
  if (!Array.isArray(rawInviteEmails)) return [];

  return [...new Set(
    rawInviteEmails
      .map(normalizeEmail)
      .filter(email => email.length > 0 && isValidEmail(email))
  )];
}

function sendRoomsSnapshot(ws) {
  const actorId = ws.auth?.id;
  if (!actorId) return;

  ws.send(JSON.stringify({
    type: 'ROOMS_SNAPSHOT',
    rooms: rooms.getRoomsSnapshotForPeer(actorId, ws.auth?.email),
  }));
}

function broadcastRoomsSnapshots() {
  for (const client of wss.clients) {
    if (client.readyState !== 1) continue;
    if (!client.auth?.id) continue;
    sendRoomsSnapshot(client);
  }
}

wss.on('connection', (ws, req) => {
  const auth = authenticateWsRequest(req);

  if (!auth?.id) {
    ws.close(WS_UNAUTHORIZED_CLOSE_CODE, 'Unauthorized');
    return;
  }

  ws.auth = auth;

  sendRoomsSnapshot(ws);
  
  ws.on('message', async (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (!msg || typeof msg !== 'object') return;
      if (typeof msg.type !== 'string') return;

      const actorId = ws.auth?.id;
      if (!actorId) return;

      switch (msg.type) {
        /* ---------- ROOMS (STUBS) ---------- */

        case 'ROOM_CREATE': {
          const roomName = String(msg.name || '').trim();
          if (!roomName) return;

          const isPublic = msg.isPublic !== false;
          const inviteEmails = isPublic ? [] : parseInviteEmails(msg.inviteEmails);
          const invitedUsers = inviteEmails.length > 0
            ? await prisma.user.findMany({
              where: {
                email: { in: inviteEmails },
              },
              select: {
                id: true,
              },
            })
            : [];

          rooms.createRoom({
            name: roomName,
            ownerId: actorId,
            isPublic,
            invitedPeerIds: invitedUsers.map((user) => user.id),
            invitedEmails: inviteEmails,
          });

          broadcastRoomsSnapshots();
          return;
        }

        case 'ROOM_UPDATE': {
          const room = rooms.getRoom(msg.roomId);
          if (!room) return;
          if (!room.canManage(actorId)) return;

          const roomName = String(msg.name || '').trim();
          if (!roomName) return;

          const isPublic = msg.isPublic !== false;
          const inviteEmails = isPublic ? [] : parseInviteEmails(msg.inviteEmails);
          const invitedUsers = inviteEmails.length > 0
            ? await prisma.user.findMany({
              where: {
                email: { in: inviteEmails },
              },
              select: {
                id: true,
              },
            })
            : [];

          room.updateSettings({
            name: roomName,
            isPublic,
            invitedPeerIds: invitedUsers.map((user) => user.id),
            invitedEmails: inviteEmails,
          });

          broadcastRoomsSnapshots();
          return;
        }

        case 'ROOM_JOIN': {
          const room = rooms.getRoom(msg.roomId);
          if (!room) return;
          if (!room.canJoin(actorId, ws.auth?.email)) return;

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
