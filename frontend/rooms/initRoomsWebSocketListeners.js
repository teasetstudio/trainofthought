import { getWebSocketClient } from '../utils/getWebSocketClient.js';
import { isAuthenticated } from '../utils/authState.js';
import { navigateToPath } from '../utils/navigateToPath.js';
import { openEditModal } from './createStudioModal.js';

const roomsEl = document.getElementById('rooms');
const roomsEmptyEl = document.getElementById('rooms-empty');
const searchInputEl = document.getElementById('rooms-search-input');
const visibilityFilterEl = document.getElementById('rooms-visibility-filter');
const accessFilterEl = document.getElementById('rooms-access-filter');
const sortSelectEl = document.getElementById('rooms-sort-select');

const defaultControlsState = {
  searchQuery: '',
  visibility: 'all',
  access: 'all',
  sort: 'name-asc',
};

const controlsState = { ...defaultControlsState };

let latestRooms = [];
let controlsInitialized = false;

export async function initRoomsWebSocketListeners() {
  initRoomDiscoveryControls();

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
        await renderRoomList();
        break;

      case 'ROOM_JOINED':
        navigateToPath(`/room/${msg.roomId}`);
        break;
    }
  });
}

function initRoomDiscoveryControls() {
  if (controlsInitialized) return;
  controlsInitialized = true;

  searchInputEl?.addEventListener('input', () => {
    controlsState.searchQuery = String(searchInputEl.value || '').trim().toLowerCase();
    renderRoomList();
  });

  visibilityFilterEl?.addEventListener('change', () => {
    controlsState.visibility = visibilityFilterEl.value || defaultControlsState.visibility;
    renderRoomList();
  });

  accessFilterEl?.addEventListener('change', () => {
    controlsState.access = accessFilterEl.value || defaultControlsState.access;
    renderRoomList();
  });

  sortSelectEl?.addEventListener('change', () => {
    controlsState.sort = sortSelectEl.value || defaultControlsState.sort;
    renderRoomList();
  });
}

function applyRoomSearchFilterSort(rooms) {
  const searchableRooms = Array.isArray(rooms) ? rooms : [];

  return searchableRooms
    .filter((room) => {
      if (!room || typeof room !== 'object') return false;

      const roomName = String(room.name || '').toLowerCase();
      if (controlsState.searchQuery && !roomName.includes(controlsState.searchQuery)) {
        return false;
      }

      if (controlsState.visibility === 'public' && room.isPublic !== true) {
        return false;
      }

      if (controlsState.visibility === 'private' && room.isPublic !== false) {
        return false;
      }

      if (controlsState.access === 'manageable' && room.canManage !== true) {
        return false;
      }

      if (controlsState.access === 'join-only' && room.canManage === true) {
        return false;
      }

      return true;
    })
    .sort((left, right) => {
      const leftName = String(left?.name || '').toLowerCase();
      const rightName = String(right?.name || '').toLowerCase();

      if (controlsState.sort === 'name-desc') {
        return rightName.localeCompare(leftName);
      }

      if (controlsState.sort === 'public-first') {
        if (left.isPublic === right.isPublic) {
          return leftName.localeCompare(rightName);
        }
        return left.isPublic ? -1 : 1;
      }

      if (controlsState.sort === 'private-first') {
        if (left.isPublic === right.isPublic) {
          return leftName.localeCompare(rightName);
        }
        return left.isPublic ? 1 : -1;
      }

      return leftName.localeCompare(rightName);
    });
}

function updateRoomsEmptyState(filteredRoomsCount) {
  if (!roomsEmptyEl) return;

  if (latestRooms.length === 0) {
    roomsEmptyEl.textContent = 'No studios yet. Be the first to found one.';
    return;
  }

  if (filteredRoomsCount === 0) {
    roomsEmptyEl.textContent = 'No studios match your search and filters.';
    return;
  }

  roomsEmptyEl.textContent = '';
}

async function renderRoomList() {
  roomsEl.innerHTML = '';
  const socket = await getWebSocketClient();
  const rooms = applyRoomSearchFilterSort(latestRooms);
  updateRoomsEmptyState(rooms.length);

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
