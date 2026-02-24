import { getUserId } from '../utils/getUserId.js';
import { WEB_SOCKET_URL } from '../const/index.js';

let ws;
let rooms = [];
const roomsEl = document.getElementById('rooms');

const userId = getUserId();

export function ensureWebSocket() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    return ws;
  }

  ws = new WebSocket(WEB_SOCKET_URL);

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
        window.location.href = `/room/${msg.id}`;
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

