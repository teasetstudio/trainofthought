import { pendingNode } from '../pendingNode.js';
import { sendNodeMove } from '../webSocketSendEvents.js';
import { applyNodeTextWrap } from '../nodeLayout.js';

/**
 * Returns { x, y } with optional axis constraint when shift is held.
 * When shift is held, movement is locked to whichever axis has the larger delta.
 */
export function applyShiftConstraint(shiftKey, dx, dy, initialX, initialY, freeX, freeY) {
  if (!shiftKey) return { x: freeX, y: freeY };
  if (Math.abs(dx) > Math.abs(dy)) {
    return { x: freeX, y: initialY };
  }
  return { x: initialX, y: freeY };
}

/**
 * Updates the pending node's data and DOM position, and notifies peers.
 */
export function movePendingNode(x, y, userId, roomId) {
  pendingNode.nodeData.x = x;
  pendingNode.nodeData.y = y;
  const hw = pendingNode.nodeData.w / 2;
  const hh = pendingNode.nodeData.h / 2;
  pendingNode.svgNode.attr("x", x - hw).attr("y", y - hh);
  d3.select(`#id_node-back_${pendingNode.nodeData.id}`).attr("x", x - hw).attr("y", y - hh);
  applyNodeTextWrap(d3.select(`#id_node-text_${pendingNode.nodeData.id}`));
  sendNodeMove(userId, roomId, pendingNode.nodeData.id, x, y);
}
