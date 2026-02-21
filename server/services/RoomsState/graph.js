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
  nodes = new Map(); // id → node
  links = [];

  constructor(nodes, links) {
    for (const node of nodes) {
      this.nodes.set(node.id, { ...node });
    }
    this.links = [...links];
  }

  getGraphSnapshot = () => ({
    nodes: [...this.nodes.values()].map(n => ({ ...n })),
    links: this.links.map(l => ({ ...l })),
  });

  applyNodeMove = (msg) => {
    const node = this.nodes.get(msg.id);
    if (!node) return false;
    node.x = msg.x;
    node.y = msg.y;
    return true;
  };

  applyNodeCreate(msg) {
    const { node, link } = msg;

    if (!node || typeof node.id !== 'number') return false;

    if (!this.nodes.has(node.id)) {
      this.nodes.set(node.id, { ...node });
    }

    if (
      link &&
      typeof link.source === 'number' &&
      typeof link.target === 'number' &&
      !this.links.some(l => l.source === link.source && l.target === link.target)
    ) {
      this.links.push({
        source: link.source,
        target: link.target
      });
    }

    return true;
  }

  applyNodeContent = (msg) => {
    const node = this.nodes.get(msg.id);
    if (!node) return false;
    node.content = msg.content;
    return true;
  };
}
