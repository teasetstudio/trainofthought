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

  setGraph = (nodes, links) => {
    this.nodes = Array.isArray(nodes) ? nodes : [];
    this.links = Array.isArray(links) ? links : [];
  }

  addNode = (newNode) => {
    // Validation
    if (!newNode || typeof newNode !== 'object') return;
    if (typeof newNode.id !== 'number') return;
    const nodeExist = this.findNodeById(newNode.id);
    if (nodeExist) return;

    this.nodes.push(newNode);
  }

  findNodeById = (id) => {
    return this.nodes.find(node => node.id === id);
  }

  getLinks = () => {
    return this.links;
  }

  addLink = (newLink) => {
    // Validation
    if (!newLink || typeof newLink !== 'object') return;
    if (typeof newLink.source !== 'number' || typeof newLink.target !== 'number') return;

    this.links.push(newLink);
  }

  updateNodeCoordinates = (nodeId, newX, newY) => {
    // Validation
    if (typeof nodeId !== 'number' || typeof newX !== 'number' || typeof newY !== 'number') return;
    const node = this.findNodeById(nodeId);
    if (!node) return;

    node.x = newX;
    node.y = newY;
  }

  updateNodeContent = (nodeId, newContent) => {
    const node = this.findNodeById(nodeId);
    if (!node) return;

    node.content = newContent;
  }

  linkExists = (sourceId, targetId) => {
    return this.links.some(l => l.source === sourceId && l.target === targetId);
  }

  removeLink = (sourceId, targetId) => {
    this.links = this.links.filter(l => !(l.source === sourceId && l.target === targetId));
  }

  removeNode = (nodeId) => {
    this.nodes = this.nodes.filter(n => n.id !== nodeId);
  }

  removeLinksForNode = (nodeId) => {
    this.links = this.links.filter(l => l.source !== nodeId && l.target !== nodeId);
  }
}

const data = new Data([], []);

export { data };
