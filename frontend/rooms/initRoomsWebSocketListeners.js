import { getWebSocketClient } from '../utils/getWebSocketClient.js';
import { isAuthenticated } from '../utils/authState.js';

const roomsEl = document.getElementById('rooms');

export async function initRoomsWebSocketListeners() {
  let ws;

  try {
    ws = await getWebSocketClient();
  } catch {
    window.location.href = '/login';
    return;
  }

  ws.addEventListener('close', () => {
    if (!isAuthenticated()) {
      window.location.href = '/login';
      return;
    }
    console.log('WebSocket disconnected');
  }, { once: true });

  ws.addEventListener('message', async (event) => {
    let msg;
    try {
      msg = JSON.parse(event.data);
    } catch {
      return;
    }

    switch (msg.type) {
      case 'ROOMS_SNAPSHOT':
        await renderRoomList(msg.rooms);
        break;

      case 'ROOM_JOINED':
        window.location.href = `/room/${msg.roomId}`;
        break;
    }
  });
}

async function renderRoomList(rooms) {
  roomsEl.innerHTML = '';
  const socket = await getWebSocketClient();

  for (const room of rooms) {
    const li = document.createElement('li');
    li.textContent = room.name;

    li.addEventListener('click', () => {
      socket.send(JSON.stringify({
        type: 'ROOM_JOIN',
        roomId: room.id,
      }));
    });

    roomsEl.appendChild(li);
  }
}
