import { svgContainer } from './svg.js';
import { data } from '../data/data.js';
import { updateContentModal } from '../components/updateContentModal.js';
import { createLinkWithHistory, deleteNodeWithHistory } from '../actionHistory.js';
import { getUserId, getRoomIdFromPath } from '../../utils/index.js';
import { isLinking, startLinking, updateLinkingLine, updateLinkingHover, finishLinking } from './linkingState.js';
import { getSingleSelectedNodeId } from './selectionState.js';
import { enterFolder, getCurrentFolderId } from '../folderState.js';

const _userId = getUserId();
const _roomId = getRoomIdFromPath();

let _overlayG = null;
let _panelOpen = false;
let _linkModeCleanup = null;
let _overlayNodeId = null;

const BTN_R = 11;

function _stopOverlayLinkMode() {
  if (_linkModeCleanup) {
    _linkModeCleanup();
    _linkModeCleanup = null;
  }
}

function _startOverlayLinking(sourceNodeId) {
  const sourceNode = data.findNodeById(sourceNodeId);
  if (!sourceNode) return;

  _stopOverlayLinkMode();
  hideNodeOverlay();
  startLinking(sourceNode);

  const handlePointerMove = (event) => {
    if (!isLinking()) {
      _stopOverlayLinkMode();
      return;
    }

    const [x, y] = d3.pointer(event, svgContainer.node());
    updateLinkingLine(x, y);
    updateLinkingHover(event.clientX, event.clientY);
  };

  const handlePointerDown = (event) => {
    if (!isLinking()) {
      _stopOverlayLinkMode();
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const targetId = updateLinkingHover(event.clientX, event.clientY);
    const sourceId = finishLinking();

    if (targetId !== null && targetId !== sourceId) {
      createLinkWithHistory(sourceId, targetId, _userId, _roomId);
    }

    _stopOverlayLinkMode();
  };

  const handleEscape = (event) => {
    if (event.key !== 'Escape' || !isLinking()) return;
    finishLinking();
    _stopOverlayLinkMode();
  };

  window.addEventListener('mousemove', handlePointerMove);
  window.addEventListener('mousedown', handlePointerDown, true);
  window.addEventListener('keydown', handleEscape, true);

  _linkModeCleanup = () => {
    window.removeEventListener('mousemove', handlePointerMove);
    window.removeEventListener('mousedown', handlePointerDown, true);
    window.removeEventListener('keydown', handleEscape, true);
  };
}

function _btnPos(node) {
  return {
    cx: node.x + node.w / 2,
    cy: node.y - node.h / 2,
  };
}

function _getOverlayNode(nodeId) {
  const node = data.findNodeById(nodeId);
  if (!node) return null;

  if (nodeId === getCurrentFolderId()) {
    return {
      ...node,
      isPinnedParent: true,
    };
  }

  return node;
}

export function showNodeOverlay(node) {
  if (!node) {
    syncNodeOverlay();
    return;
  }

  const panelWasOpen = _panelOpen && _overlayNodeId === node.id;
  hideNodeOverlay();
  _overlayNodeId = node.id;
  _render(node);

  if (panelWasOpen) {
    _renderPanel(node);
  }
}

export function hideNodeOverlay() {
  if (_overlayG) {
    _overlayG.remove();
    _overlayG = null;
  }
  _panelOpen = false;
  _overlayNodeId = null;
}

export function moveNodeOverlay(node) {
  if (!_overlayG || _overlayNodeId !== node.id) return;
  const panelWasOpen = _panelOpen;
  _overlayG.remove();
  _overlayG = null;
  _panelOpen = false;
  _overlayNodeId = node.id;
  _render(node);
  if (panelWasOpen) _renderPanel(node);
}

export function syncNodeOverlay() {
  const selectedNodeId = getSingleSelectedNodeId();

  if (selectedNodeId === null) {
    hideNodeOverlay();
    return;
  }

  const selectedNode = _getOverlayNode(selectedNodeId);
  if (!selectedNode) {
    hideNodeOverlay();
    return;
  }

  showNodeOverlay(selectedNode);
}

function _render(node) {
  _overlayG = svgContainer.append('g')
    .attr('class', 'node-overlay')
    .attr('id', `id_node-overlay_${node.id}`);

  const { cx, cy } = _btnPos(node);

  _overlayG.append('circle')
    .attr('class', 'node-overlay__btn')
    .attr('cx', cx)
    .attr('cy', cy)
    .attr('r', BTN_R)
    .on('click', (event) => {
      event.stopPropagation();
      const n = _getOverlayNode(_overlayNodeId);
      if (_panelOpen) {
        _closePanel();
      } else {
        _renderPanel(n);
      }
    });

  // Three-dot icon
  [-4, 0, 4].forEach(offset => {
    _overlayG.append('circle')
      .attr('class', 'node-overlay__btn-dot')
      .attr('cx', cx + offset)
      .attr('cy', cy)
      .attr('r', 1.8)
      .attr('pointer-events', 'none');
  });
}

function _renderPanel(node) {
  _panelOpen = true;
  const { cx, cy } = _btnPos(node);
  const panelW = 140;
  const itemH = 36;
  const items = [
    {
      label: '📂 Enter node',
      onClick: (event) => {
        event.stopPropagation();
        const id = _overlayNodeId;
        hideNodeOverlay();
        enterFolder(id);
      },
    },
    {
      label: '🔗 Link node',
      onClick: (event) => {
        event.stopPropagation();
        const sourceNodeId = _overlayNodeId;
        _startOverlayLinking(sourceNodeId);
      },
    },
    {
      label: '✏ Edit content',
      onClick: (event) => {
        event.stopPropagation();
        const n = data.findNodeById(_overlayNodeId);
        hideNodeOverlay();
        updateContentModal(n.id, n.content, n.nodeType);
      },
    },
    {
      label: '🗑 Delete node',
      cls: 'node-overlay__panel-item--danger',
      onClick: (event) => {
        event.stopPropagation();
        const idToDelete = _overlayNodeId;

        if (idToDelete === getCurrentFolderId()) {
          alert('You cannot delete the parent node while inside its folder.');
          return;
        }

        hideNodeOverlay();
        deleteNodeWithHistory(idToDelete, _userId, _roomId);
      },
    },
  ];
  const panelH = items.length * itemH + 10;
  const panelX = cx - panelW / 2;
  const panelY = cy + BTN_R + 5;

  const panelG = _overlayG.append('g').attr('class', 'node-overlay__panel');

  panelG.append('rect')
    .attr('class', 'node-overlay__panel-bg')
    .attr('x', panelX)
    .attr('y', panelY)
    .attr('width', panelW)
    .attr('height', panelH)
    .attr('rx', 7);

  items.forEach((item, i) => {
    panelG.append('text')
      .attr('class', `node-overlay__panel-item${item.cls ? ' ' + item.cls : ''}`)
      .attr('x', panelX + 14)
      .attr('y', panelY + 5 + i * itemH + itemH / 2)
      .attr('dominant-baseline', 'central')
      .text(item.label)
      .on('click', item.onClick ?? null);
  });
}

function _closePanel() {
  _panelOpen = false;
  _overlayG.select('.node-overlay__panel').remove();
}
