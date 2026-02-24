import { ensureWebSocket } from './frontend/rooms/ensureWebSocket.js';
import { getUserId } from './frontend/utils/getUserId.js';

const userId = getUserId();
const modal = document.getElementById('create-modal');
const input = document.getElementById('studio-name-input');

window.openCreateModal = function () {
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  setTimeout(() => input.focus(), 50);
};

window.closeCreateModal = function () {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  input.value = '';
};

window.confirmCreateRoom = function () {
  const name = input.value.trim();
  if (!name) {
    input.focus();
    input.classList.add('shake');
    setTimeout(() => input.classList.remove('shake'), 400);
    return;
  }
  const socket = ensureWebSocket();
  socket.send(JSON.stringify({ type: 'ROOM_CREATE', name, userId }));
  closeCreateModal();
};

// Close on backdrop click
modal.addEventListener('click', (e) => {
  if (e.target === modal) closeCreateModal();
});

// Submit on Enter
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') confirmCreateRoom();
  if (e.key === 'Escape') closeCreateModal();
});

ensureWebSocket();
