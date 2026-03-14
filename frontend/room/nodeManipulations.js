import { data } from './data/data.js';
import { updateSvgNodeContent, moveSvgNode, updateSvgGraph } from './svg/index.js';

// File contains functions that manipulate BOTH the data store and the svg graph

export function nodeCreate(node, link) {
  data.addNode(node);
  data.addLink(link);

  // updating entire graph is inefficient, is it possible to just add the new node
  updateSvgGraph();
}

export function nodeMove(nodeId, x, y) {
  data.updateNodeCoordinates(nodeId, x, y);

  moveSvgNode(nodeId, x, y);
}

export function updateNodeContent(nodeId, newContent) {
  data.updateNodeContent(nodeId, newContent);
  updateSvgNodeContent(nodeId, newContent);
}

export function nodeDelete(nodeId) {
  data.removeLinksForNode(nodeId);
  data.removeNode(nodeId);
  updateSvgGraph();
}

export function linkCreate(sourceId, targetId) {
  if (data.linkExists(sourceId, targetId)) return;
  data.addLink({ source: sourceId, target: targetId });
  updateSvgGraph();
}

export function linkDelete(sourceId, targetId) {
  if (!data.linkExists(sourceId, targetId)) return;
  data.removeLink(sourceId, targetId);
  updateSvgGraph();
}

export function updateNodeType(nodeId, nodeType) {
  data.updateNodeType(nodeId, nodeType);
  updateSvgGraph();
}
