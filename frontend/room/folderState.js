import { data } from './data/data.js';
import { updateSvgGraph } from './svg/index.js';
import { svg } from './svg/svg.js';
import { svgZoom } from './svg/dragZoomHelpers.js';
import { clearSelection } from './svg/selectionState.js';

const REFERENCE_TYPES = new Set(['Character', 'Scene', 'Location', 'Theme', 'Arc']);

let _currentFolderId = null;

function focusOnNode(nodeId) {
  if (nodeId === null || nodeId === undefined) return;
  const targetNode = data.findNodeById(nodeId);
  if (!targetNode) return;

  const svgNode = svg.node();
  if (!svgNode) return;

  const currentTransform = d3.zoomTransform(svgNode);
  const zoomScale = currentTransform.k;

  const width = Number(svg.attr('width')) || window.innerWidth;
  const height = Number(svg.attr('height')) || window.innerHeight;
  const targetX = targetNode.x;
  const targetY = targetNode.y;

  const nextTransform = d3.zoomIdentity
    .translate((width / 2) - targetX * zoomScale, (height / 2) - targetY * zoomScale)
    .scale(zoomScale);

  svg.call(svgZoom.transform, nextTransform);
}

export function getCurrentFolderId() {
  return _currentFolderId;
}

export function enterFolder(nodeId) {
  _currentFolderId = nodeId;
  clearSelection();
  updateSvgGraph();
  focusOnNode(nodeId);
  renderBreadcrumb();
  renderParentContextCard();
}

export function exitFolder() {
  if (_currentFolderId === null) return;
  const exitingFolderId = _currentFolderId;
  const currentFolder = data.findNodeById(_currentFolderId);
  _currentFolderId = currentFolder?.parentId ?? null;
  clearSelection();
  updateSvgGraph();
  renderBreadcrumb();
  renderParentContextCard();
  focusOnNode(exitingFolderId);
}

export function goToRoot() {
  const exitingFolderId = _currentFolderId;
  _currentFolderId = null;
  clearSelection();
  updateSvgGraph();
  renderBreadcrumb();
  renderParentContextCard();
  focusOnNode(exitingFolderId);
}

export function getCurrentParentNode() {
  if (_currentFolderId === null) return null;
  return data.findNodeById(_currentFolderId) ?? null;
}

/**
 * Returns { visibleNodes, visibleLinks } for the current folder view.
 * direct children + reference nodes linked to those children.
 */
export function getVisibleGraph() {
  const allNodes = data.getNodes();
  const allLinks = data.getLinks();
  const currentParent = getCurrentParentNode();

  // direct children of current folder
  const directChildren = allNodes.filter(
    n => (n.parentId ?? null) === _currentFolderId
  );
  const directChildIds = new Set(directChildren.map(n => n.id));

  // also show reference nodes linked to/from direct children
  const referencedIds = new Set();
  for (const link of allLinks) {
    if (directChildIds.has(link.source)) {
      const target = data.findNodeById(link.target);
      if (target && REFERENCE_TYPES.has(target.nodeType)) {
        referencedIds.add(link.target);
      }
    }
    if (directChildIds.has(link.target)) {
      const source = data.findNodeById(link.source);
      if (source && REFERENCE_TYPES.has(source.nodeType)) {
        referencedIds.add(link.source);
      }
    }
  }

  const visibleIds = new Set([...directChildIds, ...referencedIds]);
  const visibleNodes = allNodes.filter(n => visibleIds.has(n.id));

  if (currentParent) {
    const pinnedParentNode = {
      ...currentParent,
      x: currentParent.x,
      y: currentParent.y,
      isPinnedParent: true,
    };

    visibleNodes.unshift(pinnedParentNode);
    visibleIds.add(currentParent.id);
  }

  const visibleLinks = allLinks.filter(
    l => visibleIds.has(l.source) && visibleIds.has(l.target)
  );

  return { visibleNodes, visibleLinks };
}

/**
 * Returns breadcrumb path from root to current folder.
 */
export function getBreadcrumbPath() {
  const path = [];
  let cursor = _currentFolderId;
  while (cursor !== null) {
    const node = data.findNodeById(cursor);
    if (!node) break;
    path.unshift({ id: node.id, content: node.content, nodeType: node.nodeType });
    cursor = node.parentId ?? null;
  }
  return path;
}

/**
 * Renders breadcrumb bar into the DOM.
 */
export function renderBreadcrumb() {
  let bar = document.getElementById('folder-breadcrumb');
  if (!bar) {
    bar = document.createElement('nav');
    bar.id = 'folder-breadcrumb';
    bar.className = 'folder-breadcrumb';
    bar.setAttribute('aria-label', 'Folder navigation');
    document.body.prepend(bar);
  }

  const path = getBreadcrumbPath();
  bar.innerHTML = '';

  // Root link
  const rootLink = document.createElement('button');
  rootLink.className = 'folder-breadcrumb__item';
  rootLink.textContent = '🏠 Root';
  rootLink.addEventListener('click', () => goToRoot());
  bar.appendChild(rootLink);

  // Path segments
  path.forEach((segment, i) => {
    const sep = document.createElement('span');
    sep.className = 'folder-breadcrumb__sep';
    sep.textContent = ' / ';
    bar.appendChild(sep);

    const isLast = i === path.length - 1;
    if (isLast) {
      const current = document.createElement('span');
      current.className = 'folder-breadcrumb__current';
      current.textContent = segment.content;
      bar.appendChild(current);
    } else {
      const link = document.createElement('button');
      link.className = 'folder-breadcrumb__item';
      link.textContent = segment.content;
      link.addEventListener('click', () => enterFolder(segment.id));
      bar.appendChild(link);
    }
  });

  bar.style.display = (_currentFolderId === null && path.length === 0) ? 'none' : 'flex';
}

export function renderParentContextCard() {
  const card = document.getElementById('parent-context-card');
  if (!card) return;
  card.style.display = 'none';
  card.replaceChildren();
}
