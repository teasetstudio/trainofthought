export class Peer {
  id;
  role;
  joinedAt;
  cursor = null;
  metadata = {};

  constructor({
    id,
    role = 'viewer', // 'viewer' | 'editor' | 'owner'
    metadata = {},
  }) {
    this.id = id;
    this.role = role;
    this.metadata = metadata;
    this.joinedAt = Date.now();
  }

  canEdit() {
    return this.role === 'editor' || this.role === 'owner';
  }

  setCursor(cursor) {
    this.cursor = cursor;
  }

  toSnapshot() {
    return {
      id: this.id,
      role: this.role,
      joinedAt: this.joinedAt,
      cursor: this.cursor,
      metadata: this.metadata,
    };
  }
}
