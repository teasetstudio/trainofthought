import { sendRoomJoinEvent } from './frontend/room/webSocketSendEvents.js';
import { svgDrag, svgZoom } from './frontend/room/svg/dragZoomHelpers.js'; 
import { svg, setSvgSize } from './frontend/room/svg/svg.js';
import { getUserId, getRoomIdFromPath, requireAuth } from './frontend/utils/index.js';
import { initRoomWebSocketListeners } from './frontend/room/initRoomWebSocketListeners.js';
import { hideNodeOverlay } from './frontend/room/svg/index.js';
import { clearSelection, getSelectedLinks, getSelectedNodeIds, hasAnySelection } from './frontend/room/svg/selectionState.js';
import { linkDelete, nodeDelete } from './frontend/room/nodeManipulations.js';
import { sendLinkDelete, sendNodeDelete } from './frontend/room/webSocketSendEvents.js';
import { getCurrentFolderId, renderBreadcrumb, renderParentContextCard } from './frontend/room/folderState.js';

if (!requireAuth('/login')) {
  throw new Error('Authentication required');
}

const roomId = getRoomIdFromPath();
const userId = getUserId();

if (!roomId) {
  alert('Invalid room');
  throw new Error('Missing room id');
}

await initRoomWebSocketListeners();
renderBreadcrumb();
renderParentContextCard();

function isEditableTarget(target) {
  return target instanceof HTMLElement
    && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
}

function deleteSelection() {
  const selectedNodeIds = getSelectedNodeIds();
  const currentFolderId = getCurrentFolderId();

  if (currentFolderId !== null && selectedNodeIds.includes(currentFolderId)) {
    alert('You cannot delete the parent node while inside its folder.');
  }

  const deletableNodeIds = selectedNodeIds.filter(nodeId => nodeId !== currentFolderId);
  const selectedNodeIdSet = new Set(selectedNodeIds);
  const selectedLinks = getSelectedLinks().filter(link => {
    return !selectedNodeIdSet.has(link.source) && !selectedNodeIdSet.has(link.target);
  });

  if (deletableNodeIds.length === 0 && selectedLinks.length === 0) {
    return;
  }

  clearSelection();
  hideNodeOverlay();

  selectedLinks.forEach(link => {
    linkDelete(link.source, link.target);
    sendLinkDelete(userId, roomId, link.source, link.target);
  });

  deletableNodeIds.forEach(nodeId => {
    nodeDelete(nodeId);
    sendNodeDelete(userId, roomId, nodeId);
  });
}

// SVG
svg.call(svgDrag);
svg.call(svgZoom);
svg.on('click', (event) => {
  if (!event.target.closest('.node, .node-link, .node-overlay')) {
    clearSelection();
    hideNodeOverlay();
  }
});

window.addEventListener('keydown', (event) => {
  if (event.key !== 'Delete' && event.key !== 'Backspace') return;
  if (isEditableTarget(event.target)) return;
  if (!hasAnySelection()) return;

  event.preventDefault();
  deleteSelection();
});

window.addEventListener('resize', () => {
  setSvgSize()
});

sendRoomJoinEvent(roomId);
