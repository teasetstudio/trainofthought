import { getWebSocketClient } from '../utils/index.js';

// triggers 'ROOM_JOINED' response with graph data
export function sendRoomJoinEvent(roomId) {
  setTimeout(async () => {
    const ws = await getWebSocketClient();
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: 'ROOM_JOIN', roomId }));
  }, 500);
}

const lastMoveSentAtByNodeId = new Map();

export async function sendNodeMove(userId, roomId, nodeId, x, y, options = {}) {
  const socket = await getWebSocketClient();
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  
  if (!options.force) {
    const now = Date.now();
    const lastMoveSentAt = lastMoveSentAtByNodeId.get(nodeId) ?? 0;
    if (now - lastMoveSentAt < 25) return;
    lastMoveSentAtByNodeId.set(nodeId, now);
  }
  
  socket.send(JSON.stringify({ type: 'NODE_MOVE', nodeId, x, y, userId, roomId }));
}

export async function sendNodeCreate(userId, roomId, node, link) {
  const socket = await getWebSocketClient();
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  if (!node || typeof node !== 'object') return;
  socket.send(JSON.stringify({ type: 'NODE_CREATE', node, link, userId, roomId }));
}

export async function sendNodeContent(userId, roomId, nodeId, content) {
  const socket = await getWebSocketClient();
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify({ type: 'NODE_CONTENT', nodeId, content, userId, roomId }));
}

export async function sendNodeDelete(userId, roomId, nodeId) {
  const socket = await getWebSocketClient();
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify({ type: 'NODE_DELETE', nodeId, userId, roomId }));
}

export async function sendLinkCreate(userId, roomId, source, target) {
  const socket = await getWebSocketClient();
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify({ type: 'LINK_CREATE', source, target, userId, roomId }));
}

export async function sendLinkDelete(userId, roomId, source, target) {
  const socket = await getWebSocketClient();
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify({ type: 'LINK_DELETE', source, target, userId, roomId }));
}

export async function sendNodeType(userId, roomId, nodeId, nodeType) {
  const socket = await getWebSocketClient();
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify({ type: 'NODE_TYPE', nodeId, nodeType, userId, roomId }));
}
