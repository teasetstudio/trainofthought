import {
  openCreateModal,
  closeCreateModal,
  confirmCreateRoom,
  initCreateStudioModal,
  initRoomsWebSocketListeners,
} from './frontend/rooms/index.js';
import { clearAuthSession, navigateToPath, requireAuth } from './frontend/utils/index.js';

if (!requireAuth('/login')) {
  throw new Error('Authentication required');
}

// Expose to inline onclick handlers in HTML
window.openCreateModal = openCreateModal;
window.closeCreateModal = closeCreateModal;
window.confirmCreateRoom = confirmCreateRoom;
window.logout = () => {
  clearAuthSession();
  navigateToPath('/login');
};

initCreateStudioModal();

initRoomsWebSocketListeners();
