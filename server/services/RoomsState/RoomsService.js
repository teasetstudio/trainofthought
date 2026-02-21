import crypto from 'crypto';
import { defaultGraphState } from './graph.js';
import { Room } from './room.js';

export class RoomsService {
  rooms = new Map();

  constructor() {
    this.createRoom({
      id: 'default',
      name: 'Default Room',
      ownerId: 'system',
      isPublic: true,
      graphSeed: defaultGraphState,
    });
  }

  createRoom = ({
    id,
    name,
    isPublic = true,
    ownerId,
    graphSeed,
  }) => {
    const newRoomId = id || crypto.randomUUID();
    const room = new Room({
      id: newRoomId,
      name,
      isPublic,
      ownerId,
      graphSeed,
    });
    this.rooms.set(newRoomId, room);
    return room;
  };

  getRoom = (roomId) => {
    return this.rooms.get(roomId);
  };

  deleteRoom = (roomId) => {
    this.rooms.delete(roomId);
  };

  getRoomsSnapshot = () => {
    return [...this.rooms.values()].map(room => ({
      id: room.id,
      name: room.name
    }));
  };
};
