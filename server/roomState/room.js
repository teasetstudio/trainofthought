import { GraphData, defaultGraphState } from "./graph.js";
import { Peer } from "./peer.js";

export class Room {
  id;
  name;
  isPublic;
  peers = new Map(); // peerId → Peer
  graph;
  ownerId;

  // optional actor queue
  queue = [];
  processing = false;

  constructor({ id, name, isPublic = true, ownerId, graphSeed = defaultGraphState }) {
    this.id = id;
    this.name = name;
    this.isPublic = isPublic;
    this.ownerId = ownerId;
    this.graph = new GraphData(
      graphSeed?.nodes ?? [],
      graphSeed?.links ?? []
    );
  }

  /* ---------- peer management ---------- */

  canJoin(peerId) {
    if (this.isPublic) return true;
    return peerId === this.ownerId || this.peers.has(peerId);
  }

  addPeer(peerData) {
    if (this.peers.has(peerData.id)) return false;

    const peer = new Peer(peerData);
    this.peers.set(peer.id, peer);
    return peer;
  }

  removePeer(peerId) {
    this.peers.delete(peerId);
  }

  getPeer(peerId) {
    return this.peers.get(peerId);
  }

  /* ---------- permissions ---------- */

  canEdit(peerId) {
    const peer = this.peers.get(peerId);
    return peer?.canEdit() ?? false;
  }

  /* ---------- graph façade ---------- */

  moveNode(peerId, msg) {
    if (!this.canEdit(peerId)) return false;
    return this.graph.applyNodeMove(msg);
  }

  createNode(peerId, msg) {
    if (!this.canEdit(peerId)) return false;
    return this.graph.applyNodeCreate(msg);
  }

  updateNodeContent(peerId, msg) {
    if (!this.canEdit(peerId)) return false;
    return this.graph.applyNodeContent(msg);
  }

  /* ---------- snapshot ---------- */

  getSnapshot() {
    return {
      id: this.id,
      isPublic: this.isPublic,
      peers: [...this.peers.values()].map(p => p.toSnapshot()),
      graph: this.graph.getGraphSnapshot(),
    };
  }
}
