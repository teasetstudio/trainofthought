const nodesData = [
  { id: 1, x: 100, y: 100, r: 10, content: "Node 1" },
  { id: 2, x: 200, y: 200, r: 20, content: "Node 2" },
  { id: 3, x: 300, y: 300, r: 30, content: "Node 33" },
];

const linksData = [
  { source: 1, target: 2 },
  { source: 2, target: 3 },
];

function calculateEdgePosition(source, target) {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance === 0) {
    return { x: target.x, y: target.y };
  }

  const ratio = target.r / distance;
  return {
      x: target.x - dx * ratio,
      y: target.y - dy * ratio,
  };
}

class Data {
  nodes = [];
  links = [];

  constructor(nodes, links) {
    this.nodes = nodes;
    this.links = links;
  }

  getNodes = () => {
    return this.nodes;
  }

  addNode = (newNode) => {
    this.nodes.push(newNode);
  }

  findNodeById = (id) => {
    return this.nodes.find(node => node.id === id);
  }

  getLinks = () => {
    return this.links;
  }

  addLink = (newLink) => {
    this.links.push(newLink);
  }

  updateNodeContent = (id, newContent) => {
    const nodeIndex = this.nodes.findIndex(node => node.id === id);
    this.nodes[nodeIndex].content = newContent;
  }

  calculateEdgePosition(source, target) {
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
  
    if (distance === 0) {
      return { x: target.x, y: target.y };
    }
  
    const ratio = target.r / distance;
    return {
        x: target.x - dx * ratio,
        y: target.y - dy * ratio,
    };
  }
}

const data = new Data(nodesData, linksData);

export {
  data,
  calculateEdgePosition,
};