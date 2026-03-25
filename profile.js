import {
  clearAuthSession,
  fetchWithAuth,
  getAuthSession,
  navigateToPath,
  requireAuth,
  setAuthSession,
} from './frontend/utils/index.js';

if (!requireAuth('/login')) {
  throw new Error('Authentication required');
}

const form = document.getElementById('profile-form');
const emailInput = document.getElementById('profile-email');
const displayNameInput = document.getElementById('profile-display-name');
const statusEl = document.getElementById('profile-status');
const logoutButton = document.getElementById('logout-button');

function setStatus(message, isSuccess = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle('success', Boolean(isSuccess));
}

async function loadProfile() {
  setStatus('Loading...');

  const response = await fetchWithAuth('/api/auth/me');

  if (!response.ok) {
    setStatus('Please login again');
    navigateToPath('/login');
    return;
  }

  const data = await response.json();
  emailInput.value = data.user.email || '';
  displayNameInput.value = data.user.displayName || '';
  setStatus('');
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const displayName = displayNameInput.value.trim();
  if (!displayName) {
    setStatus('Display name is required');
    return;
  }

  setStatus('Saving...');

  try {
    const response = await fetchWithAuth('/api/auth/me', {
      method: 'PATCH',
      body: JSON.stringify({ displayName }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setStatus(data.error || 'Failed to save profile');
      if (response.status === 401) {
        navigateToPath('/login');
      }
      return;
    }

    const session = getAuthSession();
    if (session?.token) {
      setAuthSession({
        token: session.token,
        user: data.user,
      });
    }

    setStatus('Profile updated', true);
  } catch {
    setStatus('Unable to reach server');
  }
});

logoutButton.addEventListener('click', () => {
  clearAuthSession();
  navigateToPath('/login');
});

await loadProfile();
