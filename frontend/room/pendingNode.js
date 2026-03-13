import { data } from './data/data.js';
import { svgContainer } from './svg/svg.js';
import { updateSvgGraph } from './svg/index.js';
import { updateContentModal } from './components/updateContentModal.js';
import { computeNodeWidth, computeNodeHeight } from './nodeLayout.js';

function getNextNodeId() {
  return data.getNodes().reduce((maxNodeId, node) => {
    return Math.max(maxNodeId, node.id);
  }, 0) + 1;
}

/**
 * Tracks the state of a node currently being created via alt+drag.
 *
 * Lifecycle:
 *   1. create()   – builds the node/link, adds to data, re-renders, caches SVG refs
 *   2. (drag)     – caller updates `svgNode` / `svgLink` positions directly
 *   3. finalize() – removes "active" class, opens content-edit modal, resets state
 */
class PendingNode {
  /** @type {d3.Selection|null} SVG circle element for the node being placed */
  svgNode = null;

  /** @type {object|null} Data object bound to svgNode */
  nodeData = null;

  /** @type {d3.Selection|null} SVG line element connecting parent → new node */
  svgLink = null;

  /** @type {object|null} Data object bound to svgLink */
  linkData = null;

  /** True while a node creation drag is in progress. */
  get isActive() {
    return this.svgNode !== null;
  }

  /**
   * Creates a new node (and an optional link from parentNode), re-renders the
   * graph, then caches the resulting SVG elements for the ongoing drag.
   *
   * @param {MouseEvent} event  - The originating D3 event (used when no parentNode)
   * @param {object|null} parentNode - Data of the node the user alt-dragged from
   */
  create = (event, parentNode) => {
    let x, y;
    if (parentNode) {
      x = parentNode.x;
      y = parentNode.y;
    } else {
      [x, y] = d3.pointer(event, svgContainer.node());
    }

    const nodeId = getNextNodeId();
    const content = `Node ${nodeId}`;
    const w = computeNodeWidth(content);
    const node = {
      id: nodeId,
      x,
      y,
      w,
      h: computeNodeHeight(content, w),
      content,
    };

    data.addNode(node);
    if (parentNode) data.addLink({ source: parentNode.id, target: node.id });
    updateSvgGraph();

    this._cacheSvgElements(node.id, parentNode?.id);
  };

  /**
   * Called at the end of the creation drag.
   * Opens the content-edit modal, then resets all state fields.
   */
  finalize = () => {
    const { id, content } = this.nodeData;
    this.svgNode.classed('active', false);
    this.svgNode = null;
    this.nodeData = null;
    this.svgLink = null;
    this.linkData = null;
    updateContentModal(id, content);
  };

  /** Caches D3 selections and bound data for the freshly rendered node and its link. */
  _cacheSvgElements = (nodeId, parentNodeId) => {
    this.svgNode = d3.select(`#id_node_${nodeId}`);
    this.nodeData = this.svgNode.datum();
    if (parentNodeId) {
      this.svgLink = d3.select(`#id_node-link_${parentNodeId}_${nodeId}`);
      this.linkData = this.svgLink.datum();
    }
  };
}

export const pendingNode = new PendingNode();
