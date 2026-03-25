import { getWebSocketClient } from '../utils/getWebSocketClient.js';
import { isAuthenticated } from '../utils/authState.js';
import { navigateToPath } from '../utils/navigateToPath.js';
import { openEditModal } from './createStudioModal.js';

const roomsEl = document.getElementById('rooms');
let latestRooms = [];

export async function initRoomsWebSocketListeners() {
  let ws;

  try {
    ws = await getWebSocketClient();
  } catch {
    navigateToPath('/login');
    return;
  }

  ws.addEventListener('close', () => {
    if (!isAuthenticated()) {
      navigateToPath('/login');
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
        latestRooms = Array.isArray(msg.rooms) ? msg.rooms : [];
        await renderRoomList(msg.rooms);
        break;

      case 'ROOM_JOINED':
        navigateToPath(`/room/${msg.roomId}`);
        break;
    }
  });
}

async function renderRoomList(rooms) {
  roomsEl.innerHTML = '';
  const socket = await getWebSocketClient();

  for (const room of rooms) {
    const li = document.createElement('li');
    li.classList.add('room-list-item');

    const roomTitle = document.createElement('span');
    roomTitle.classList.add('room-title');
    roomTitle.textContent = room.isPublic ? room.name : `🔒 ${room.name}`;
    li.appendChild(roomTitle);

    if (room.canManage) {
      const editButton = document.createElement('button');
      editButton.type = 'button';
      editButton.classList.add('room-edit-btn');
      editButton.textContent = 'Edit';
      editButton.addEventListener('click', (event) => {
        event.stopPropagation();
        const currentRoom = latestRooms.find((candidate) => candidate.id === room.id);
        if (!currentRoom) return;
        openEditModal(currentRoom);
      });
      li.appendChild(editButton);
    }

    li.addEventListener('click', () => {
      socket.send(JSON.stringify({
        type: 'ROOM_JOIN',
        roomId: room.id,
      }));
    });

    roomsEl.appendChild(li);
  }
}
