export const defaultGraphState = {
  nodes: [
    { id: 1, x: 100, y: 100, w: 160, h: 46, content: 'Node 1', nodeType: null, parentId: null },
    { id: 2, x: 200, y: 200, w: 160, h: 46, content: 'Node 2', nodeType: null, parentId: null },
    { id: 3, x: 300, y: 300, w: 160, h: 46, content: 'Node 33', nodeType: null, parentId: null },
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
    const node = this.nodes.get(msg.nodeId);
    if (!node) return false;
    node.x = msg.x;
    node.y = msg.y;
    return true;
  };

  applyNodeCreate = (msg) => {
    const { node, link } = msg;

    if (!node || typeof node.id !== 'number') return false;

    if (!this.nodes.has(node.id)) {
      this.nodes.set(node.id, { ...node, nodeType: node.nodeType ?? null, parentId: node.parentId ?? null });
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
    const node = this.nodes.get(msg.nodeId);
    if (!node) return false;
    node.content = msg.content;
    return true;
  };

  applyNodeType = (msg) => {
    const node = this.nodes.get(msg.nodeId);
    if (!node) return false;
    node.nodeType = msg.nodeType ?? null;
    return true;
  };

  applyNodeDelete = (msg) => {
    if (!this.nodes.has(msg.nodeId)) return false;
    this.nodes.delete(msg.nodeId);
    this.links = this.links.filter(
      l => l.source !== msg.nodeId && l.target !== msg.nodeId
    );
    return true;
  };

  applyLinkCreate = (msg) => {
    const { source, target } = msg;
    if (typeof source !== 'number' || typeof target !== 'number') return false;
    if (!this.nodes.has(source) || !this.nodes.has(target)) return false;
    if (this.links.some(l => l.source === source && l.target === target)) return false;
    this.links.push({ source, target });
    return true;
  };

  applyLinkDelete = (msg) => {
    const { source, target } = msg;
    if (typeof source !== 'number' || typeof target !== 'number') return false;

    const initialCount = this.links.length;
    this.links = this.links.filter(l => !(l.source === source && l.target === target));

    return this.links.length !== initialCount;
  };
}
