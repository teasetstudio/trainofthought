import { navigateToPath, redirectAuthenticated, setAuthSession } from './frontend/utils/index.js';

if (!redirectAuthenticated('/rooms')) {
  const form = document.getElementById('auth-form');
  const displayNameField = document.getElementById('display-name-field');
  const displayNameInput = document.getElementById('display-name');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const submitButton = document.getElementById('submit-button');
  const modeToggle = document.getElementById('mode-toggle');
  const modeLabel = document.getElementById('mode-label');
  const authStatus = document.getElementById('auth-status');

  let mode = 'login';

  function renderMode() {
    const isRegister = mode === 'register';

    displayNameField.classList.toggle('hidden', !isRegister);
    displayNameInput.required = isRegister;

    submitButton.textContent = isRegister ? 'Create account' : 'Sign in';
    modeToggle.textContent = isRegister ? 'Use existing account' : 'Create account';
    modeLabel.textContent = isRegister ? 'Create your account.' : 'Sign in to continue.';
    authStatus.textContent = '';
    authStatus.classList.remove('success');
  }

  modeToggle.addEventListener('click', () => {
    mode = mode === 'login' ? 'register' : 'login';
    renderMode();
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const payload = {
      email: emailInput.value.trim(),
      password: passwordInput.value,
      ...(mode === 'register' ? { displayName: displayNameInput.value.trim() } : {}),
    };

    authStatus.textContent = 'Working...';
    authStatus.classList.remove('success');

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        authStatus.textContent = data.error || 'Authentication failed';
        return;
      }

      setAuthSession({
        token: data.token,
        user: data.user,
      });

      authStatus.textContent = 'Success. Redirecting...';
      authStatus.classList.add('success');
      navigateToPath('/rooms');
    } catch {
      authStatus.textContent = 'Unable to reach server';
    }
  });

  renderMode();
}
