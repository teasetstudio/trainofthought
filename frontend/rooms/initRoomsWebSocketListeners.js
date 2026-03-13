import { getUserId } from '../utils/getUserId.js';
import { getWebSocketClient } from '../utils/getWebSocketClient.js';

const roomsEl = document.getElementById('rooms');
const userId = getUserId();

export async function initRoomsWebSocketListeners() {
  const ws = await getWebSocketClient();

  ws.addEventListener('close', () => {
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
        userId,
      }));
    });

    roomsEl.appendChild(li);
  }
}
