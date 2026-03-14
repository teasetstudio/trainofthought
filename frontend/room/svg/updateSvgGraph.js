import { data } from '../data/data.js';
import { calculateEdgePosition } from '../data/dataUtils.js';
import { pendingNode } from '../pendingNode.js';
import { svgContainer } from './svg.js';
import { getUserId, getRoomIdFromPath } from '../../utils/index.js';
import { sendNodeMove, sendNodeCreate, sendLinkCreate } from '../webSocketSendEvents.js';
import { applyShiftConstraint, movePendingNode } from './pendingNodeHelpers.js';
import { applyNodeTextWrap } from '../nodeLayout.js';
import { hideNodeOverlay, syncNodeOverlay } from './nodeOverlay.js';
import { isLinking, startLinking, updateLinkingLine, updateLinkingHover, finishLinking } from './linkingState.js';
import { linkCreate } from '../nodeManipulations.js';
import { getVisibleGraph } from '../folderState.js';
import {
  applySelectionStyles,
  getSelectedNodeIds,
  hasSingleSelectedNode,
  isNodeSelected,
  isSelectionToggleEvent,
  pruneSelection,
  selectOnlyLink,
  selectOnlyNode,
  toggleLinkSelection,
  toggleNodeSelection,
} from './selectionState.js';

const userId = getUserId();
const roomId = getRoomIdFromPath();

const NODE_TYPE_COLORS = {
  // Plot item nodes
  PlotChapter:  '#d2d6f2',
  PlotBeat:     '#c4d6e9',
  TurningPoint: '#d7c5e9',
  // Reference nodes
  Character:    '#d4c699',
  Scene:        '#99d1bb',
  Location:     '#9dd2ca',
  Theme:        '#96cea0',
  Arc:          '#d684a3',
};

function raiseNodes(nodeIds) {
  nodeIds.forEach(nodeId => {
    d3.select(`#id_node-back_${nodeId}`).raise();
    d3.select(`#id_node-text_${nodeId}`).raise();
    d3.select(`#id_node_${nodeId}`).raise().classed('active', true);
  });
}

function updateAllLinkPositions(nodes) {
  const nodesById = new Map(nodes.map(node => [node.id, node]));

  svgContainer.selectAll('.node-link')
    .attr('x1', link => nodesById.get(link.source).x)
    .attr('y1', link => nodesById.get(link.source).y)
    .attr('x2', link => {
      const source = nodesById.get(link.source);
      const target = nodesById.get(link.target);
      return calculateEdgePosition(source, target).x;
    })
    .attr('y2', link => {
      const source = nodesById.get(link.source);
      const target = nodesById.get(link.target);
      return calculateEdgePosition(source, target).y;
    });
}

// updating entire graph
export async function updateSvgGraph() {
  const { visibleNodes: nodes, visibleLinks: links } = getVisibleGraph();
  const nodesById = new Map(nodes.map(node => [node.id, node]));

  pruneSelection();

  svgContainer.selectAll(".node-link")
    .data(links, d => `${d.source}_${d.target}`)
    .join(
      enter => enter.append("line").attr("class", "node-link"),
      update => update,
      exit => exit.remove()
    )
    .attr("id", d => `id_node-link_${d.source}_${d.target}`)
    .on("click", function(event, d) {
      event.stopPropagation();
      if (isSelectionToggleEvent(event)) {
        toggleLinkSelection(d.source, d.target);
      } else {
        selectOnlyLink(d.source, d.target);
      }

      syncNodeOverlay();
    })
    .attr("x1", d => {
      const source = nodesById.get(d.source);
      return source.x;
    })
    .attr("y1", d => {
      const source = nodesById.get(d.source);
      return source.y;
    })
    .attr("x2", d => {
      const source = nodesById.get(d.source);
      const target = nodesById.get(d.target);
      return calculateEdgePosition(source, target).x;
    })
    .attr("y2", d => {
      const source = nodesById.get(d.source);
      const target = nodesById.get(d.target);
      return calculateEdgePosition(source, target).y;
    })
    .lower(); // keep links behind node circles regardless of DOM insertion order

  // Just decaration
  svgContainer.selectAll(".node-back")
    .data(nodes, d => d.id)
    .join(
      enter => enter.append("rect").attr("class", "node-back"),
      update => update,
      exit => exit.remove()
    )
    .attr("x", d => d.x - d.w / 2)
    .attr("y", d => d.y - d.h / 2)
    .attr("width", d => d.w)
    .attr("height", d => d.h)
    .attr("rx", 10)
    .attr("id", d => `id_node-back_${d.id}`)
    .attr("fill", d => NODE_TYPE_COLORS[d.nodeType] || '#E5E7EB')

  svgContainer.selectAll(".node-text")
    .data(nodes, d => d.id)
    .join(
      enter => enter.append("text").attr("class", "node-text"),
      update => update,
      exit => exit.remove()
    )
    .attr("id", d => `id_node-text_${d.id}`)
    .attr("text-anchor", "middle")
    .call(applyNodeTextWrap);

  svgContainer.selectAll(".node")
    .data(nodes, d => d.id)
    .join(
      enter => enter.append("rect").attr("class", "node"),
      update => update,
      exit => exit.remove()
    )
    .attr("x", d => d.x - d.w / 2)
    .attr("y", d => d.y - d.h / 2)
    .attr("width", d => d.w)
    .attr("height", d => d.h)
    .attr("rx", 10)
    .attr("id", d => `id_node_${d.id}`)
    .on("click", function(event, d) {
      event.stopPropagation();

      if (isSelectionToggleEvent(event)) {
        toggleNodeSelection(d.id);
      } else if (!isNodeSelected(d.id) || !hasSingleSelectedNode()) {
        selectOnlyNode(d.id);
      }

      syncNodeOverlay();
    })
    .call(d3.drag()
      .on("start", function(event, d) {
        d.didDrag = false;

        // Shift+drag → link-drawing mode (takes priority over alt+drag)
        if (event.sourceEvent.shiftKey && !pendingNode.isActive) {
          hideNodeOverlay();
          startLinking(d);
          return;
        }

        if (event.sourceEvent.altKey && !pendingNode.isActive) {
          pendingNode.create(event, d);

          if (pendingNode.nodeData) {
            sendNodeCreate(userId, roomId, pendingNode.nodeData, pendingNode.linkData);
          }
        }

        if (pendingNode.isActive) {
          hideNodeOverlay();
          d3.select(`#id_node-back_${pendingNode.nodeData.id}`).raise();
          d3.select(`#id_node-text_${pendingNode.nodeData.id}`).raise();
          pendingNode.svgNode.raise().classed("active", true);
          pendingNode.svgLink.lower();
        } else {
          if (!isNodeSelected(d.id) && !isSelectionToggleEvent(event.sourceEvent)) {
            selectOnlyNode(d.id);
          }

          hideNodeOverlay();

          d.dragNodeIds = isNodeSelected(d.id) ? getSelectedNodeIds() : [d.id];
          d.dragInitialPositions = new Map(
            d.dragNodeIds.map(nodeId => {
              const node = data.findNodeById(nodeId);
              return [nodeId, { x: node.x, y: node.y }];
            })
          );

          raiseNodes(d.dragNodeIds);
        }

        d.dragOriginX = d.x;
        d.dragOriginY = d.y;
      })
      .on("drag", function(event, d) {
        if (isLinking()) {
          updateLinkingLine(event.x, event.y);
          updateLinkingHover(event.sourceEvent.clientX, event.sourceEvent.clientY);
          return;
        }

        const dx = event.x - d.dragOriginX;
        const dy = event.y - d.dragOriginY;
        const { x, y } = applyShiftConstraint(event.sourceEvent.shiftKey, dx, dy, d.dragOriginX, d.dragOriginY, event.x, event.y);

        if (pendingNode.isActive) {
          movePendingNode(x, y, userId, roomId);

          if (pendingNode.svgLink && pendingNode.linkData) {
            const parentNode = data.findNodeById(pendingNode.linkData.source)
            const nodeEdgePos = calculateEdgePosition(parentNode, pendingNode.nodeData)
            pendingNode.svgLink
              .attr("x1", parentNode.x)
              .attr("y1", parentNode.y)
              .attr("x2", nodeEdgePos.x)
              .attr("y2", nodeEdgePos.y);
          }
        } else {
          const dragDx = x - d.dragOriginX;
          const dragDy = y - d.dragOriginY;

          if (dragDx !== 0 || dragDy !== 0) {
            d.didDrag = true;
          }

          const dragNodeIds = d.dragNodeIds ?? [d.id];
          const dragInitialPositions = d.dragInitialPositions ?? new Map([[d.id, { x: d.x, y: d.y }]]);

          dragNodeIds.forEach(nodeId => {
            const initialPosition = dragInitialPositions.get(nodeId);
            const node = data.findNodeById(nodeId);
            if (!initialPosition || !node) return;

            const nextX = initialPosition.x + dragDx;
            const nextY = initialPosition.y + dragDy;

            node.x = nextX;
            node.y = nextY;

            d3.select(`#id_node_${nodeId}`).attr("x", nextX - node.w / 2).attr("y", nextY - node.h / 2);
            d3.select(`#id_node-back_${nodeId}`).attr("x", nextX - node.w / 2).attr("y", nextY - node.h / 2);
            applyNodeTextWrap(d3.select(`#id_node-text_${nodeId}`));

            sendNodeMove(userId, roomId, nodeId, nextX, nextY);
          });

          updateAllLinkPositions(data.getNodes());
        }
      })
      .on("end", function(event, d) {
        if (isLinking()) {
          const targetId = updateLinkingHover(event.sourceEvent.clientX, event.sourceEvent.clientY);
          const sourceId = finishLinking();

          if (targetId !== null && targetId !== sourceId) {
            linkCreate(sourceId, targetId);
            sendLinkCreate(userId, roomId, sourceId, targetId);
          }

          return;
        }

        if (pendingNode.isActive) {
          pendingNode.finalize();
        } else {
          (d.dragNodeIds ?? [d.id]).forEach(nodeId => {
            d3.select(`#id_node_${nodeId}`).classed("active", false);
          });

          if (!d.didDrag) {
            syncNodeOverlay();
          } else {
            hideNodeOverlay();
          }

          d.dragNodeIds = null;
          d.dragInitialPositions = null;
        }
  }));

  applySelectionStyles();
  syncNodeOverlay();
}
