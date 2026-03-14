import { updateNodeContent, updateNodeType } from '../nodeManipulations.js';
import { getUserId, getRoomIdFromPath } from '../../utils/index.js';
import { sendNodeContent, sendNodeType } from '../webSocketSendEvents.js';
import { openModal } from '../../shared/modal.js';
import { createSelectInput } from '../../shared/selectInput.js';

const userId = getUserId();
const roomId = getRoomIdFromPath();

const NODE_TYPE_GROUPS = [
  {
    label: 'Plot Items',
    options: [
      { value: 'PlotChapter', label: 'Chapter 📖' },
      { value: 'PlotBeat', label: 'Plot Beat ・' },
      { value: 'TurningPoint', label: 'Turning Point ➤' },
    ],
  },
  {
    label: 'Reference Nodes',
    options: [
      { value: 'Character', label: 'Character 👤' },
      { value: 'Scene', label: 'Scene 🎬' },
      { value: 'Location', label: 'Location 📍' },
      { value: 'Theme', label: 'Theme 💡' },
      { value: 'Arc', label: 'Arc ↗️' },
    ],
  },
];

export function updateContentModal(nodeId, currentValue, currentNodeType) {
  let textarea;
  let typeSelect;

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

  const typeField = createSelectInput({
    id: `node-type-${nodeId}`,
    label: 'Node type',
    value: currentNodeType || 'PlotChapter',
    placeholder: '— None —',
    groups: NODE_TYPE_GROUPS,
  });

  typeSelect = typeField.select;

  modal.body.append(typeField.wrapper, label, textarea);

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
      const selectedType = typeSelect.value || null;

      updateNodeContent(nodeId, nodeText);
      sendNodeContent(userId, roomId, nodeId, nodeText);

      if (selectedType !== (currentNodeType || null)) {
        updateNodeType(nodeId, selectedType);
        sendNodeType(userId, roomId, nodeId, selectedType);
      }

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