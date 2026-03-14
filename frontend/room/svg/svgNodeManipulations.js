import { data } from '../data/data.js';
import { calculateEdgePosition } from '../data/dataUtils.js';
import { svgContainer } from './svg.js';
import { applyNodeTextWrap, computeNodeWidth, computeNodeHeight } from '../nodeLayout.js';
import { moveNodeOverlay } from './nodeOverlay.js';
import { getVisibleGraph } from '../folderState.js';

export const moveSvgNode = (nodeId, newX, newY) => {
  const node = data.findNodeById(nodeId);
  if (!node) return;
  const hw = node.w / 2;
  const hh = node.h / 2;
  d3.select(`#id_node_${nodeId}`).attr('x', newX - hw).attr('y', newY - hh);
  d3.select(`#id_node-back_${nodeId}`).attr('x', newX - hw).attr('y', newY - hh);
  applyNodeTextWrap(d3.select(`#id_node-text_${nodeId}`));
  moveNodeOverlay(node);

  // in future optimize by only updating links connected to this node
  updateAllSvgLinks();
};

const updateAllSvgLinks = () => {
  const { visibleNodes: nodes, visibleLinks: links } = getVisibleGraph();
  const nodesById = new Map(nodes.map(node => [node.id, node]));

  svgContainer.selectAll('.node-link')
    .data(links, d => `${d.source}_${d.target}`)
    .attr('x1', d => {
      const source = nodesById.get(d.source);
      return source ? source.x : null;
    })
    .attr('y1', d => {
      const source = nodesById.get(d.source);
      return source ? source.y : null;
    })
    .attr('x2', d => {
      const source = nodesById.get(d.source);
      const target = nodesById.get(d.target);
      if (!source || !target) return null;
      return calculateEdgePosition(source, target).x;
    })
    .attr('y2', d => {
      const source = nodesById.get(d.source);
      const target = nodesById.get(d.target);
      if (!source || !target) return null;
      return calculateEdgePosition(source, target).y;
    });
}

export const updateSvgNodeContent = (nodeId, newContent) => {
  const node = data.findNodeById(nodeId);
  if (!node) return;
  // Recompute dimensions in case content size changed
  node.w = computeNodeWidth(newContent);
  node.h = computeNodeHeight(newContent, node.w);
  const rx = node.x - node.w / 2;
  const ry = node.y - node.h / 2;
  d3.select(`#id_node_${nodeId}`).attr('x', rx).attr('y', ry).attr('width', node.w).attr('height', node.h);
  d3.select(`#id_node-back_${nodeId}`).attr('x', rx).attr('y', ry).attr('width', node.w).attr('height', node.h);
  svgContainer.selectAll(".node-text")
    .filter(d => d.id === nodeId)
    .call(applyNodeTextWrap);
  // Arrows attach to card edges, so recalculate after size change
  updateAllSvgLinks();
};
