export const defaultGraphState = {
  nodes: [
    { id: 1, x: 100, y: 100, r: 10, content: 'Node 1' },
    { id: 2, x: 200, y: 200, r: 20, content: 'Node 2' },
    { id: 3, x: 300, y: 300, r: 30, content: 'Node 33' },
  ],
  links: [
    { source: 1, target: 2 },
    { source: 2, target: 3 },
  ],
};

//  GOOD POINTS TO CONSIDER:
// - Help you enforce “no async in mutation” with patterns
// - Show how to add a lightweight operation queue
// - Model this as an actor-per-node system
// - Explain what changes if you move to worker threads or clustering
export class GraphData {
  nodes = [];
  links = [];

  constructor(nodes, links) {
    this.nodes = [...nodes];
    this.links = [...links];
  }

  getGraphSnapshot = () => ({
    nodes: this.nodes.map(n => ({ ...n })),
    links: this.links.map(l => ({ ...l })),
  });

  applyNodeMove = (msg) => {
    const node = this.nodes.find(n => n.id === msg.id);
    if (!node) return false;
    node.x = msg.x;
    node.y = msg.y;
    return true;
  };

  applyNodeCreate = (msg) => {
    const node = msg.node;
    if (!node || typeof node !== 'object') return false;
    if (typeof node.id !== 'number') return false;

    const exists = this.nodes.some(n => n.id === node.id);
    if (!exists) {
      this.nodes.push({ ...node });
    }

    const link = msg.link;
    if (link && typeof link === 'object' && typeof link.source === 'number' && typeof link.target === 'number') {
      const linkExists = this.links.some(l => l.source === link.source && l.target === link.target);
      if (!linkExists) {
        this.links.push({ source: link.source, target: link.target });
      }
    }

    return true;
  };

  applyNodeContent = (msg) => {
    const node = this.nodes.find(n => n.id === msg.id);
    if (!node) return false;
    node.content = msg.content;
    return true;
  };
}

export const graphState = new GraphData(defaultGraphState.nodes, defaultGraphState.links);
