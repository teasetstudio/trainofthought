import { data } from './data.js';
import { svgContainer } from '../svg.js';
import { updateGraph } from '../graph.js';
import { updateContentModal } from './updateContent.js';

class NewNode {
  nodeSvg = null;
  nodeData = null;
  linkSvg = null;
  linkData = null;

  finalizeNodeCreation = () => {
    const id = this.nodeData.id;
    const content = this.nodeData.content;
    this.nodeSvg.classed("active", false);
    this.nodeSvg = null;
    this.nodeData = null;
    this.linkSvg = null;
    this.linkData = null;
    updateContentModal(id, content);
  }

  // d = data of the parent circle
  create = (event, d) => {
    let x = 0;
    let y = 0;
    if (d) {
      x = d.x;
      y = d.y;
    } else {
      const coor = d3.pointer(event, svgContainer.node());
      x = coor[0];
      y = coor[1];
    }
    const newNode = { id: data.nodes.length + 1, x, y, r: 30, content: "Node " + (data.nodes.length + 1) };
    data.addNode(newNode);
    if (d) data.addLink({ source: d.id, target: newNode.id });
    updateGraph();
    this._setCreatingData(newNode.id, d?.id)
  }

  _setCreatingData = (newNodeId, parentNodeId) => {
    this.nodeSvg = d3.select(`#id_node_${newNodeId}`);
    this.nodeData = this.nodeSvg.datum();
    if (parentNodeId) {
      this.linkSvg = d3.select(`#id_node-link_${parentNodeId}_${newNodeId}`);
      this.linkData = this.linkSvg.datum();
    }
  };
}

const newNode = new NewNode();

export { newNode };
