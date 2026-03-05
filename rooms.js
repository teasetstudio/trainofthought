import {
  openCreateModal,
  closeCreateModal,
  confirmCreateRoom,
  initCreateStudioModal,
  initRoomsWebSocketListeners,
} from './frontend/rooms/index.js';

// Expose to inline onclick handlers in HTML
window.openCreateModal = openCreateModal;
window.closeCreateModal = closeCreateModal;
window.confirmCreateRoom = confirmCreateRoom;

initCreateStudioModal();

initRoomsWebSocketListeners();
