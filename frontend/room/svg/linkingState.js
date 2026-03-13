import { svgContainer } from './svg.js';

let _sourceNodeId = null;
let _tempLine = null;
let _hoverTargetNodeId = null;

const NODE_ID_PATTERNS = [
  /^id_node_(\d+)$/,
  /^id_node-back_(\d+)$/,
  /^id_node-text_(\d+)$/,
];

function toggleNodeClass(nodeId, className, enabled) {
  if (nodeId === null || nodeId === undefined) return;
  d3.select(`#id_node_${nodeId}`).classed(className, enabled);
}

function extractNodeIdFromElement(element) {
  let current = element;

  while (current) {
    const id = current.id || '';
    for (const pattern of NODE_ID_PATTERNS) {
      const match = id.match(pattern);
      if (match) return Number(match[1]);
    }
    current = current.parentElement;
  }

  return null;
}

function getNodeIdFromPoint(clientX, clientY) {
  const targetElement = document.elementFromPoint(clientX, clientY);
  if (!targetElement) return null;
  return extractNodeIdFromElement(targetElement);
}

function setHoverTarget(nodeId) {
  const nextHoverId = nodeId === _sourceNodeId ? null : nodeId;
  if (nextHoverId === _hoverTargetNodeId) return _hoverTargetNodeId;

  if (_hoverTargetNodeId !== null) {
    toggleNodeClass(_hoverTargetNodeId, 'linking-target', false);
  }

  _hoverTargetNodeId = nextHoverId;

  if (_hoverTargetNodeId !== null) {
    toggleNodeClass(_hoverTargetNodeId, 'linking-target', true);
  }

  return _hoverTargetNodeId;
}

export function isLinking() {
  return _sourceNodeId !== null;
}

export function startLinking(sourceNode) {
  _sourceNodeId = sourceNode.id;
  toggleNodeClass(_sourceNodeId, 'linking-source', true);
  setHoverTarget(null);
  _tempLine = svgContainer.append('line')
    .attr('class', 'node-link-temp')
    .attr('x1', sourceNode.x)
    .attr('y1', sourceNode.y)
    .attr('x2', sourceNode.x)
    .attr('y2', sourceNode.y);
}

export function updateLinkingLine(x, y) {
  if (!_tempLine) return;
  _tempLine.attr('x2', x).attr('y2', y);
}

/** Updates target hover state while linking and returns hovered node id (or null). */
export function updateLinkingHover(clientX, clientY) {
  if (!isLinking()) return null;
  return setHoverTarget(getNodeIdFromPoint(clientX, clientY));
}

/** Removes the temp line and returns the source node id. */
export function finishLinking() {
  const sourceId = _sourceNodeId;

  if (_sourceNodeId !== null) {
    toggleNodeClass(_sourceNodeId, 'linking-source', false);
  }
  setHoverTarget(null);

  _sourceNodeId = null;

  if (_tempLine) {
    _tempLine.remove();
    _tempLine = null;
  }

  return sourceId;
}
