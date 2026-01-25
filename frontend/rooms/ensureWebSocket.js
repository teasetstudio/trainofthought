import { getUserId } from '../utils/getUserId.js';

let ws;
let rooms = [];
const roomsEl = document.getElementById('rooms');

const userId = getUserId();

export function ensureWebSocket() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    return ws;
  }

  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const host = 'localhost:3000';
  const url = `${protocol}://${host}/ws`;
  ws = new WebSocket(url);

  ws.addEventListener('message', (event) => {
    let msg;
    try {
      msg = JSON.parse(event.data);
    } catch {
      return;
    }

    switch (msg.type) {
      case 'ROOMS_SNAPSHOT':
        rooms = msg.rooms;
        console.log('ROOMS_SNAPSHOT', rooms);
        renderRooms(rooms);
        break;

      case 'ROOM_JOINED':
        alert(`Joined room ${msg.id}`);
        break;
    }
  });

  return ws;
}

function renderRooms(rooms) {
  roomsEl.innerHTML = '';
  const socket = ensureWebSocket()

  for (const room of rooms) {
    const li = document.createElement('li');
    li.textContent = room.name;

    li.addEventListener('click', () => {
      socket.send(JSON.stringify({
        type: 'ROOM_JOIN',
        id: room.id,
        userId
      }));
    });

    roomsEl.appendChild(li);
  }
}

// stub create
window.createRoom = function () {
  const name = prompt('Room name?');
  if (!name) return;

  const socket = ensureWebSocket()

  socket.send(JSON.stringify({
    type: 'ROOM_CREATE',
    name,
    userId
  }));
};