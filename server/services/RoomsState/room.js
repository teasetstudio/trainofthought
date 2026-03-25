import { GraphData, defaultGraphState } from "./graph.js";
import { Peer } from "./peer.js";

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export class Room {
  id;
  name;
  isPublic;
  peers = new Map(); // peerId → Peer
  graph;
  ownerId;
  invitedPeerIds = new Set();
  invitedEmails = new Set();

  // optional actor queue
  queue = [];
  processing = false;

  constructor({
    id,
    name,
    isPublic = true,
    ownerId,
    graphSeed = defaultGraphState,
    invitedPeerIds = [],
    invitedEmails = [],
  }) {
    this.id = id;
    this.name = name;
    this.isPublic = isPublic;
    this.ownerId = ownerId;
    this.invitedPeerIds = new Set(invitedPeerIds.filter(Boolean));
    this.invitedEmails = new Set(invitedEmails.map(normalizeEmail).filter(Boolean));
    this.graph = new GraphData(
      graphSeed?.nodes ?? [],
      graphSeed?.links ?? []
    );
  }

  /* ---------- peer management ---------- */

  canJoin(peerId, peerEmail = '') {
    if (this.isPublic) return true;

    const normalizedEmail = normalizeEmail(peerEmail);
    return (
      peerId === this.ownerId
      || this.peers.has(peerId)
      || this.invitedPeerIds.has(peerId)
      || (normalizedEmail.length > 0 && this.invitedEmails.has(normalizedEmail))
    );
  }

  canManage(peerId) {
    return peerId === this.ownerId;
  }

  updateSettings({ name, isPublic, invitedPeerIds = [], invitedEmails = [] }) {
    if (typeof name === 'string' && name.trim().length > 0) {
      this.name = name.trim();
    }

    if (typeof isPublic === 'boolean') {
      this.isPublic = isPublic;
    }

    this.invitedPeerIds = new Set(invitedPeerIds.filter(Boolean));
    this.invitedEmails = new Set(invitedEmails.map(normalizeEmail).filter(Boolean));
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
    // const peer = this.peers.get(peerId);
    // return peer?.canEdit() ?? false;
    return true;
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

  updateNodeType(peerId, msg) {
    if (!this.canEdit(peerId)) return false;
    return this.graph.applyNodeType(msg);
  }

  deleteNode(peerId, msg) {
    if (!this.canEdit(peerId)) return false;
    return this.graph.applyNodeDelete(msg);
  }

  createLink(peerId, msg) {
    if (!this.canEdit(peerId)) return false;
    return this.graph.applyLinkCreate(msg);
  }

  deleteLink(peerId, msg) {
    if (!this.canEdit(peerId)) return false;
    return this.graph.applyLinkDelete(msg);
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
