import { data } from './data/data.js';
import { getRoomIdFromPath, getWebSocketClient, isAuthenticated } from '../utils/index.js';
import { navigateToPath } from '../utils/navigateToPath.js';
import { updateSvgGraph } from './svg/index.js';
import { nodeMove, nodeCreate, updateNodeContent, nodeDelete, linkCreate, linkDelete, updateNodeType } from './nodeManipulations.js';

const roomId = getRoomIdFromPath();

export async function initRoomWebSocketListeners() {
  let ws;

  try {
    ws = await getWebSocketClient();
  } catch {
    navigateToPath('/login');
    return;
  }

  ws.addEventListener('close', () => {
    if (!isAuthenticated()) {
      navigateToPath('/login');
      return;
    }
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
      } else if (msg.type === 'NODE_TYPE') {
        updateNodeType(msg.nodeId, msg.nodeType);
      }
    } catch {}
  });
}

