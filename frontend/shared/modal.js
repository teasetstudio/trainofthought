const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

let activeModal = null;
let modalCount = 0;

function isVisible(element) {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  const style = window.getComputedStyle(element);
  return style.display !== 'none' && style.visibility !== 'hidden' && element.getClientRects().length > 0;
}

function getFocusableElements(container) {
  return [...container.querySelectorAll(FOCUSABLE_SELECTOR)].filter((element) => {
    return element instanceof HTMLElement && !element.inert && isVisible(element);
  });
}

function toggleScrollLock(isLocked) {
  document.documentElement.classList.toggle('shared-components-scroll-lock', isLocked);
  document.body.classList.toggle('shared-components-scroll-lock', isLocked);
}

function inertBackground(modalRoot) {
  const siblings = [...document.body.children].filter((element) => element !== modalRoot);
  const previousState = siblings.map((element) => {
    return {
      element,
      inert: element.inert,
      ariaHidden: element.getAttribute('aria-hidden'),
    };
  });

  siblings.forEach((element) => {
    element.inert = true;
    element.setAttribute('aria-hidden', 'true');
  });

  return () => {
    previousState.forEach(({ element, inert, ariaHidden }) => {
      element.inert = inert;
      if (ariaHidden === null) {
        element.removeAttribute('aria-hidden');
        return;
      }

      element.setAttribute('aria-hidden', ariaHidden);
    });
  };
}

export function openModal(options = {}) {
  const {
    title = '',
    description = '',
    ariaLabel = '',
    panelClassName = '',
    overlayClassName = '',
    closeOnEscape = true,
    closeOnOverlay = true,
    initialFocus = null,
    onClose = null,
  } = options;

  if (activeModal) {
    activeModal.close('replaced');
  }

  modalCount += 1;

  const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const overlay = document.createElement('div');
  overlay.className = 'shared-modal-overlay';
  overlay.dataset.sharedModal = '';

  if (overlayClassName) {
    overlay.classList.add(...overlayClassName.split(' ').filter(Boolean));
  }

  const panel = document.createElement('section');
  panel.className = 'shared-modal';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.tabIndex = -1;

  if (panelClassName) {
    panel.classList.add(...panelClassName.split(' ').filter(Boolean));
  }

  const header = document.createElement('header');
  header.className = 'shared-modal__header';

  if (title) {
    const titleElement = document.createElement('h2');
    titleElement.className = 'shared-modal__title';
    titleElement.id = `shared-modal-title-${modalCount}`;
    titleElement.textContent = title;
    panel.setAttribute('aria-labelledby', titleElement.id);
    header.append(titleElement);
  } else if (ariaLabel) {
    panel.setAttribute('aria-label', ariaLabel);
  }

  if (description) {
    const descriptionElement = document.createElement('p');
    descriptionElement.className = 'shared-modal__description';
    descriptionElement.id = `shared-modal-description-${modalCount}`;
    descriptionElement.textContent = description;
    panel.setAttribute('aria-describedby', descriptionElement.id);
    header.append(descriptionElement);
  }

  if (header.childElementCount > 0) {
    panel.append(header);
  }

  const body = document.createElement('div');
  body.className = 'shared-modal__body';

  const footer = document.createElement('footer');
  footer.className = 'shared-modal__actions';

  panel.append(body, footer);
  overlay.append(panel);
  document.body.append(overlay);

  const restoreBackground = inertBackground(overlay);
  toggleScrollLock(true);

  let initialFocusTarget = initialFocus;
  let isClosed = false;
  let overlayMouseDownOutside = false;

  const focusFirstElement = () => {
    const resolvedInitialFocus = typeof initialFocusTarget === 'function'
      ? initialFocusTarget()
      : initialFocusTarget;

    if (resolvedInitialFocus instanceof HTMLElement && resolvedInitialFocus.isConnected) {
      resolvedInitialFocus.focus();
      return;
    }

    const [firstFocusable] = getFocusableElements(panel);
    (firstFocusable || panel).focus();
  };

  const handleFocusIn = (event) => {
    if (isClosed || panel.contains(event.target)) {
      return;
    }

    focusFirstElement();
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Escape' && closeOnEscape) {
      event.preventDefault();
      api.close('escape');
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const focusableElements = getFocusableElements(panel);
    if (focusableElements.length === 0) {
      event.preventDefault();
      panel.focus();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement;

    if (event.shiftKey) {
      if (activeElement === firstElement || activeElement === panel) {
        event.preventDefault();
        lastElement.focus();
      }
      return;
    }

    if (activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  const handleOverlayMouseDown = (event) => {
    overlayMouseDownOutside = event.target === overlay;
  };

  const handleOverlayMouseUp = (event) => {
    overlayMouseDownOutside = overlayMouseDownOutside && event.target === overlay;
  };

  const handleOverlayClick = (event) => {
    if (closeOnOverlay && overlayMouseDownOutside && event.target === overlay) {
      api.close('overlay');
    }

    overlayMouseDownOutside = false;
  };

  overlay.addEventListener('mousedown', handleOverlayMouseDown);
  overlay.addEventListener('mouseup', handleOverlayMouseUp);
  overlay.addEventListener('click', handleOverlayClick);
  overlay.addEventListener('keydown', handleKeyDown);
  document.addEventListener('focusin', handleFocusIn, true);

  const api = {
    overlay,
    panel,
    body,
    footer,
    addAction({
      label,
      variant = 'secondary',
      type = 'button',
      className = '',
      closeOnClick = false,
      onClick = null,
      attributes = {},
    }) {
      const button = document.createElement('button');
      button.type = type;
      button.className = `shared-modal__button shared-modal__button--${variant}`;
      button.textContent = label;

      if (className) {
        button.classList.add(...className.split(' ').filter(Boolean));
      }

      Object.entries(attributes).forEach(([name, value]) => {
        if (value !== undefined && value !== null) {
          button.setAttribute(name, value);
        }
      });

      button.addEventListener('click', (event) => {
        const result = onClick ? onClick(event, api) : undefined;
        if (closeOnClick && result !== false) {
          api.close('action');
        }
      });

      footer.append(button);
      return button;
    },
    setInitialFocus(target) {
      initialFocusTarget = target;
    },
    close(reason = 'programmatic') {
      if (isClosed) {
        return;
      }

      isClosed = true;
      overlay.removeEventListener('mousedown', handleOverlayMouseDown);
      overlay.removeEventListener('mouseup', handleOverlayMouseUp);
      overlay.removeEventListener('click', handleOverlayClick);
      overlay.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('focusin', handleFocusIn, true);

      if (activeModal === api) {
        activeModal = null;
      }

      restoreBackground();
      toggleScrollLock(false);
      overlay.remove();

      if (opener && opener.isConnected) {
        opener.focus();
      }

      if (typeof onClose === 'function') {
        onClose(reason);
      }
    },
  };

  activeModal = api;

  requestAnimationFrame(() => {
    overlay.classList.add('is-open');
    focusFirstElement();
  });

  return api;
}