import { data } from './data/data.js';
import { linkCreate, linkDelete, nodeDelete, nodeMove } from './nodeManipulations.js';
import { hideNodeOverlay, updateSvgGraph } from './svg/index.js';
import { clearSelection } from './svg/selectionState.js';
import {
  sendLinkCreate,
  sendLinkDelete,
  sendNodeCreate,
  sendNodeDelete,
  sendNodeMove,
} from './webSocketSendEvents.js';

const undoStack = [];
let isApplyingUndo = false;

function cloneNode(node) {
  if (!node) return null;

  return {
    ...node,
  };
}

function cloneLink(link) {
  if (!link) return null;

  return {
    source: link.source,
    target: link.target,
  };
}

function pushAction(action) {
  if (isApplyingUndo || !action) return false;

  if (action.type === 'batch' && (!Array.isArray(action.actions) || action.actions.length === 0)) {
    return false;
  }

  undoStack.push(action);
  return true;
}

function pushBatch(actions) {
  if (!Array.isArray(actions) || actions.length === 0) {
    return false;
  }

  if (actions.length === 1) {
    return pushAction(actions[0]);
  }

  return pushAction({
    type: 'batch',
    actions,
  });
}

function restoreNodeWithLinks(node, links) {
  if (!node) return;

  data.addNode(cloneNode(node));

  const restorableLinks = (Array.isArray(links) ? links : []).filter(link => {
    const sourceExists = link.source === node.id || Boolean(data.findNodeById(link.source));
    const targetExists = link.target === node.id || Boolean(data.findNodeById(link.target));
    return sourceExists && targetExists;
  });

  restorableLinks.forEach(link => {
    if (!data.linkExists(link.source, link.target)) {
      data.addLink(cloneLink(link));
    }
  });

  updateSvgGraph();
}

async function undoNodeCreate(action, userId, roomId) {
  if (!data.findNodeById(action.node.id)) {
    return;
  }

  nodeDelete(action.node.id);
  await sendNodeDelete(userId, roomId, action.node.id);
}

async function undoNodeDelete(action, userId, roomId) {
  restoreNodeWithLinks(action.node, action.links);

  const [firstLink, ...remainingLinks] = action.links ?? [];
  await sendNodeCreate(userId, roomId, cloneNode(action.node), firstLink ? cloneLink(firstLink) : null);

  for (const link of remainingLinks) {
    await sendLinkCreate(userId, roomId, link.source, link.target);
  }
}

async function undoLinkCreate(action, userId, roomId) {
  if (!data.linkExists(action.link.source, action.link.target)) {
    return;
  }

  linkDelete(action.link.source, action.link.target);
  await sendLinkDelete(userId, roomId, action.link.source, action.link.target);
}

async function undoLinkDelete(action, userId, roomId) {
  if (data.linkExists(action.link.source, action.link.target)) {
    return;
  }

  linkCreate(action.link.source, action.link.target);
  await sendLinkCreate(userId, roomId, action.link.source, action.link.target);
}

async function undoNodeMove(action, userId, roomId) {
  for (const move of action.moves ?? []) {
    nodeMove(move.nodeId, move.from.x, move.from.y);
    await sendNodeMove(userId, roomId, move.nodeId, move.from.x, move.from.y, { force: true });
  }
}

async function undoAction(action, userId, roomId) {
  switch (action?.type) {
    case 'batch': {
      const nestedActions = [...(action.actions ?? [])].reverse();
      for (const nestedAction of nestedActions) {
        await undoAction(nestedAction, userId, roomId);
      }
      return;
    }
    case 'node-create':
      await undoNodeCreate(action, userId, roomId);
      return;
    case 'node-delete':
      await undoNodeDelete(action, userId, roomId);
      return;
    case 'link-create':
      await undoLinkCreate(action, userId, roomId);
      return;
    case 'link-delete':
      await undoLinkDelete(action, userId, roomId);
      return;
    case 'node-move':
      await undoNodeMove(action, userId, roomId);
      return;
    default:
      return;
  }
}

export function canUndo() {
  return undoStack.length > 0;
}

export function recordNodeCreateAction(node, link) {
  if (!node) return false;

  return pushAction({
    type: 'node-create',
    node: cloneNode(node),
    link: link ? cloneLink(link) : null,
  });
}

export function recordNodeMoveAction(moves) {
  const normalizedMoves = (Array.isArray(moves) ? moves : [])
    .filter(move => move && move.from && move.to)
    .filter(move => move.from.x !== move.to.x || move.from.y !== move.to.y)
    .map(move => ({
      nodeId: move.nodeId,
      from: { x: move.from.x, y: move.from.y },
      to: { x: move.to.x, y: move.to.y },
    }));

  if (normalizedMoves.length === 0) {
    return false;
  }

  return pushAction({
    type: 'node-move',
    moves: normalizedMoves,
  });
}

export function createLinkWithHistory(sourceId, targetId, userId, roomId) {
  if (data.linkExists(sourceId, targetId)) {
    return false;
  }

  linkCreate(sourceId, targetId);
  sendLinkCreate(userId, roomId, sourceId, targetId);

  return pushAction({
    type: 'link-create',
    link: { source: sourceId, target: targetId },
  });
}

export function deleteNodeWithHistory(nodeId, userId, roomId) {
  const node = data.findNodeById(nodeId);
  if (!node) {
    return false;
  }

  const links = data.getLinks()
    .filter(link => link.source === nodeId || link.target === nodeId)
    .map(cloneLink);

  nodeDelete(nodeId);
  sendNodeDelete(userId, roomId, nodeId);

  return pushAction({
    type: 'node-delete',
    node: cloneNode(node),
    links,
  });
}

export function deleteGraphElementsWithHistory({ nodeIds = [], links = [], userId, roomId }) {
  const actions = [];

  links.forEach(link => {
    if (!link || !data.linkExists(link.source, link.target)) {
      return;
    }

    linkDelete(link.source, link.target);
    sendLinkDelete(userId, roomId, link.source, link.target);
    actions.push({
      type: 'link-delete',
      link: cloneLink(link),
    });
  });

  nodeIds.forEach(nodeId => {
    const node = data.findNodeById(nodeId);
    if (!node) {
      return;
    }

    const attachedLinks = data.getLinks()
      .filter(link => link.source === nodeId || link.target === nodeId)
      .map(cloneLink);

    nodeDelete(nodeId);
    sendNodeDelete(userId, roomId, nodeId);
    actions.push({
      type: 'node-delete',
      node: cloneNode(node),
      links: attachedLinks,
    });
  });

  return pushBatch(actions);
}

export async function undoLastAction({ userId, roomId }) {
  if (undoStack.length === 0) {
    return false;
  }

  const action = undoStack.pop();

  clearSelection();
  hideNodeOverlay();
  isApplyingUndo = true;

  try {
    await undoAction(action, userId, roomId);
  } finally {
    isApplyingUndo = false;
  }

  return true;
}