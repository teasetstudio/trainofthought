import { getWebSocketClient } from '../utils/index.js';
const modal = document.getElementById('create-modal');
const input = document.getElementById('studio-name-input');
const privateInput = document.getElementById('studio-private-input');
const invitesInput = document.getElementById('studio-invites-input');
const modalTitle = document.getElementById('modal-title');
const modalSubtitle = document.querySelector('.modal-subtitle');
const confirmButton = document.querySelector('.modal-confirm');
const confirmButtonLabel = document.querySelector('.modal-confirm-label');

const MODE_CREATE = 'create';
const MODE_EDIT = 'edit';

let modalMode = MODE_CREATE;
let editingRoomId = '';

function normalizeInviteEmails(rawValue) {
  return [...new Set(
    String(rawValue || '')
      .split(/[\n,;]+/)
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean)
  )];
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function shakeInput(el) {
  if (!el) return;
  el.classList.add('shake');
  setTimeout(() => el.classList.remove('shake'), 400);
}

function syncInviteInputState() {
  if (!invitesInput) return;

  const isPrivate = Boolean(privateInput?.checked);
  invitesInput.disabled = !isPrivate;
  invitesInput.style.opacity = isPrivate ? '1' : '0.65';
}

function applyModalMode(mode) {
  modalMode = mode;
  const isEdit = mode === MODE_EDIT;

  if (modalTitle) {
    modalTitle.textContent = isEdit ? 'Edit Studio' : 'Found a New Studio';
  }

  if (modalSubtitle) {
    modalSubtitle.textContent = isEdit
      ? 'Adjust privacy and invitations'
      : 'Give your chamber a name';
  }

  if (confirmButton) {
    if (confirmButtonLabel) {
      confirmButtonLabel.textContent = isEdit ? 'Save' : 'Create';
    }
  }
}

export function openCreateModal() {
  applyModalMode(MODE_CREATE);
  editingRoomId = '';

  modal.inert = false;
  modal.classList.add('open');
  syncInviteInputState();
  setTimeout(() => input.focus(), 50);
}

export function openEditModal(room) {
  if (!room || typeof room !== 'object') return;

  applyModalMode(MODE_EDIT);
  editingRoomId = room.id || '';
  input.value = room.name || '';

  if (privateInput) {
    privateInput.checked = room.isPublic === false;
  }

  if (invitesInput) {
    invitesInput.value = Array.isArray(room.invitedEmails)
      ? room.invitedEmails.join(', ')
      : '';
  }

  modal.inert = false;
  modal.classList.add('open');
  syncInviteInputState();
  setTimeout(() => input.focus(), 50);
}

export function closeCreateModal() {
  modal.classList.remove('open');
  modal.inert = true;
  applyModalMode(MODE_CREATE);
  editingRoomId = '';
  input.value = '';
  if (privateInput) privateInput.checked = false;
  if (invitesInput) invitesInput.value = '';
  syncInviteInputState();
}

export async function confirmCreateRoom() {
  const name = input.value.trim();
  if (!name) {
    input.focus();
    shakeInput(input);
    return;
  }

  const isPrivate = Boolean(privateInput?.checked);
  const inviteEmails = isPrivate ? normalizeInviteEmails(invitesInput?.value) : [];

  if (isPrivate && inviteEmails.some((email) => !isValidEmail(email))) {
    invitesInput?.focus();
    shakeInput(invitesInput);
    return;
  }

  const socket = await getWebSocketClient();
  if (modalMode === MODE_EDIT && editingRoomId) {
    socket.send(JSON.stringify({
      type: 'ROOM_UPDATE',
      roomId: editingRoomId,
      name,
      isPublic: !isPrivate,
      inviteEmails,
    }));
  } else {
    socket.send(JSON.stringify({
      type: 'ROOM_CREATE',
      name,
      isPublic: !isPrivate,
      inviteEmails,
    }));
  }
  closeCreateModal();
}

export function initCreateStudioModal() {
  if (!modal || !input) return;

  syncInviteInputState();

  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeCreateModal();
  });

  privateInput?.addEventListener('change', () => {
    syncInviteInputState();
    if (!privateInput.checked && invitesInput) {
      invitesInput.value = '';
    }
  });

  // Submit on Enter, dismiss on Escape
  modal.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') confirmCreateRoom();
    if (e.key === 'Escape') closeCreateModal();
  });
}
