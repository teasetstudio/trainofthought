export function createSelectInput({
  id,
  label,
  value = '',
  placeholder = '',
  groups = [],
  options = [],
  className = '',
}) {
  const wrapper = document.createElement('div');
  wrapper.className = 'shared-select';

  const labelElement = document.createElement('label');
  labelElement.className = 'shared-visually-hidden';
  labelElement.setAttribute('for', id);
  labelElement.textContent = label;

  const select = document.createElement('select');
  select.id = id;
  select.className = `shared-select__control shared-modal__select${className ? ` ${className}` : ''}`;

  if (placeholder) {
    const placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    placeholderOption.textContent = placeholder;
    select.appendChild(placeholderOption);
  }

  groups.forEach((group) => {
    if (!group || typeof group !== 'object') return;
    const groupLabel = String(group.label || '').trim();
    const groupOptions = Array.isArray(group.options) ? group.options : [];
    if (!groupLabel || groupOptions.length === 0) return;

    const optGroup = document.createElement('optgroup');
    optGroup.label = groupLabel;

    groupOptions.forEach((optionData) => {
      if (!optionData || typeof optionData !== 'object') return;
      const option = document.createElement('option');
      option.value = optionData.value ?? '';
      option.textContent = optionData.label ?? option.value;
      optGroup.appendChild(option);
    });

    select.appendChild(optGroup);
  });

  options.forEach((optionData) => {
    if (!optionData || typeof optionData !== 'object') return;
    const option = document.createElement('option');
    option.value = optionData.value ?? '';
    option.textContent = optionData.label ?? option.value;
    select.appendChild(option);
  });

  select.value = value ?? '';

  wrapper.append(labelElement, select);

  return {
    wrapper,
    select,
    label: labelElement,
  };
}
