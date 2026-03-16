import { getWebSocketClient } from '../utils/index.js';
const modal = document.getElementById('create-modal');
const input = document.getElementById('studio-name-input');

export function openCreateModal() {
  modal.inert = false;
  modal.classList.add('open');
  setTimeout(() => input.focus(), 50);
}

export function closeCreateModal() {
  modal.classList.remove('open');
  modal.inert = true;
  input.value = '';
}

export async function confirmCreateRoom() {
  const name = input.value.trim();
  if (!name) {
    input.focus();
    input.classList.add('shake');
    setTimeout(() => input.classList.remove('shake'), 400);
    return;
  }
  const socket = await getWebSocketClient();
  socket.send(JSON.stringify({ type: 'ROOM_CREATE', name }));
  closeCreateModal();
}

export function initCreateStudioModal() {
  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeCreateModal();
  });

  // Submit on Enter, dismiss on Escape
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') confirmCreateRoom();
    if (e.key === 'Escape') closeCreateModal();
  });
}
