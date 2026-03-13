import { updateNodeContent } from '../nodeManipulations.js';
import { getUserId, getRoomIdFromPath } from '../../utils/index.js';
import { sendNodeContent } from '../webSocketSendEvents.js';
import { openModal } from '../../shared/modal.js';

const userId = getUserId();
const roomId = getRoomIdFromPath();

export function updateContentModal(nodeId, currentValue) {
  let textarea;

  const modal = openModal({
    title: 'Edit Node Content',
    description: 'Press Enter to save. Use Shift+Enter to add a new line.',
    initialFocus: () => textarea,
  });

  const label = document.createElement('label');
  label.className = 'shared-visually-hidden';
  label.setAttribute('for', `node-content-${nodeId}`);
  label.textContent = 'Node content';

  textarea = document.createElement('textarea');
  textarea.id = `node-content-${nodeId}`;
  textarea.className = 'shared-modal__textarea';
  textarea.placeholder = 'Write your node content here';
  textarea.value = currentValue || '';

  modal.body.append(label, textarea);

  modal.addAction({
    label: 'Cancel',
    variant: 'secondary',
    onClick: () => {
      modal.close('cancel');
    },
  });

  const saveButton = modal.addAction({
    label: 'Save',
    variant: 'primary',
    onClick: () => {
      const nodeText = textarea.value;
      updateNodeContent(nodeId, nodeText);
      sendNodeContent(userId, roomId, nodeId, nodeText);
      modal.close('save');
    },
  });

  textarea.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      saveButton.click();
    }
  });
}