import { data } from '../data/data.js';

const selectedNodeIds = new Set();
const selectedLinkKeys = new Set();

function getLinkKey(sourceId, targetId) {
  return `${sourceId}_${targetId}`;
}

function hasSelectionChanged(nextNodeIds, nextLinkKeys) {
  if (selectedNodeIds.size !== nextNodeIds.size || selectedLinkKeys.size !== nextLinkKeys.size) {
    return true;
  }

  for (const nodeId of nextNodeIds) {
    if (!selectedNodeIds.has(nodeId)) {
      return true;
    }
  }

  for (const linkKey of nextLinkKeys) {
    if (!selectedLinkKeys.has(linkKey)) {
      return true;
    }
  }

  return false;
}

export function isSelectionToggleEvent(event) {
  return Boolean(event?.ctrlKey || event?.metaKey);
}

export function getSelectedNodeIds() {
  return Array.from(selectedNodeIds);
}

export function getSelectedLinks() {
  return data.getLinks().filter(link => selectedLinkKeys.has(getLinkKey(link.source, link.target)));
}

export function getSingleSelectedNodeId() {
  if (selectedNodeIds.size !== 1 || selectedLinkKeys.size !== 0) {
    return null;
  }

  return getSelectedNodeIds()[0] ?? null;
}

export function hasSingleSelectedNode() {
  return getSingleSelectedNodeId() !== null;
}

export function hasAnySelection() {
  return selectedNodeIds.size > 0 || selectedLinkKeys.size > 0;
}

export function isNodeSelected(nodeId) {
  return selectedNodeIds.has(nodeId);
}

export function isLinkSelected(sourceId, targetId) {
  return selectedLinkKeys.has(getLinkKey(sourceId, targetId));
}

export function applySelectionStyles() {
  d3.selectAll('.node').classed('selected', node => selectedNodeIds.has(node.id));
  d3.selectAll('.node-link').classed('selected', link => selectedLinkKeys.has(getLinkKey(link.source, link.target)));
}

export function clearSelection() {
  if (!hasAnySelection()) {
    return false;
  }

  selectedNodeIds.clear();
  selectedLinkKeys.clear();
  applySelectionStyles();
  return true;
}

export function selectOnlyNode(nodeId) {
  const nextNodeIds = new Set([nodeId]);
  const nextLinkKeys = new Set();

  if (!hasSelectionChanged(nextNodeIds, nextLinkKeys)) {
    return false;
  }

  selectedNodeIds.clear();
  selectedNodeIds.add(nodeId);
  selectedLinkKeys.clear();
  applySelectionStyles();
  return true;
}

export function selectOnlyLink(sourceId, targetId) {
  const nextNodeIds = new Set();
  const nextLinkKeys = new Set([getLinkKey(sourceId, targetId)]);

  if (!hasSelectionChanged(nextNodeIds, nextLinkKeys)) {
    return false;
  }

  selectedNodeIds.clear();
  selectedLinkKeys.clear();
  selectedLinkKeys.add(getLinkKey(sourceId, targetId));
  applySelectionStyles();
  return true;
}

export function toggleNodeSelection(nodeId) {
  if (selectedNodeIds.has(nodeId)) {
    selectedNodeIds.delete(nodeId);
  } else {
    selectedNodeIds.add(nodeId);
  }

  applySelectionStyles();
  return selectedNodeIds.has(nodeId);
}

export function toggleLinkSelection(sourceId, targetId) {
  const linkKey = getLinkKey(sourceId, targetId);

  if (selectedLinkKeys.has(linkKey)) {
    selectedLinkKeys.delete(linkKey);
  } else {
    selectedLinkKeys.add(linkKey);
  }

  applySelectionStyles();
  return selectedLinkKeys.has(linkKey);
}

export function pruneSelection() {
  const nodeIds = new Set(data.getNodes().map(node => node.id));
  const linkKeys = new Set(data.getLinks().map(link => getLinkKey(link.source, link.target)));

  let changed = false;

  for (const nodeId of Array.from(selectedNodeIds)) {
    if (!nodeIds.has(nodeId)) {
      selectedNodeIds.delete(nodeId);
      changed = true;
    }
  }

  for (const linkKey of Array.from(selectedLinkKeys)) {
    if (!linkKeys.has(linkKey)) {
      selectedLinkKeys.delete(linkKey);
      changed = true;
    }
  }

  if (changed) {
    applySelectionStyles();
  }

  return changed;
}