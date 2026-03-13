import { data } from './data/data.js';
import { getUserId, getRoomIdFromPath, getWebSocketClient } from '../utils/index.js';
import { updateSvgGraph } from './svg/index.js';
import { nodeMove, nodeCreate, updateNodeContent, nodeDelete, linkCreate, linkDelete } from './nodeManipulations.js';

const userId = getUserId();
const roomId = getRoomIdFromPath();

export async function initRoomWebSocketListeners() {
  const ws = await getWebSocketClient();

  ws.addEventListener('close', () => {
    console.log('WebSocket disconnected');
  }, { once: true });

  ws.addEventListener('message', (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (!msg || typeof msg !== 'object') return;
      if (msg.roomId !== roomId) return;

      if (msg.type === 'ROOM_JOINED') {
        if (typeof data.setGraph === 'function') {
          data.setGraph(msg.nodes, msg.links);
          updateSvgGraph();
        }
      } else if (msg.type === 'NODE_MOVE') {
        nodeMove(msg.nodeId, msg.x, msg.y);
      } else if (msg.type === 'NODE_CREATE') {
        nodeCreate(msg.node, msg.link);
      } else if (msg.type === 'NODE_CONTENT') {
        updateNodeContent(msg.nodeId, msg.content);
      } else if (msg.type === 'NODE_DELETE') {
        nodeDelete(msg.nodeId);
      } else if (msg.type === 'LINK_CREATE') {
        linkCreate(msg.source, msg.target);
      } else if (msg.type === 'LINK_DELETE') {
        linkDelete(msg.source, msg.target);
      }
    } catch {}
  });
}

