import { startDust, stopDust } from '/dust.js';
import { hostState } from './hostState.js';
import { resolveRoute } from './hostRouter.js';

const frame = document.getElementById('page-frame');
const nav = document.getElementById('layout-nav');
const userLabel = document.getElementById('host-user-label');

let dustRunning = false;

function applyRoute(pathname) {
  const { frameSrc, showBackground, showNav } = resolveRoute(pathname);

  if (frame.getAttribute('src') !== frameSrc) {
    frame.setAttribute('src', frameSrc);
  }

  nav.hidden = !showNav;
  document.body.classList.toggle('host-no-background', !showBackground);

  if (showBackground && !dustRunning) {
    startDust();
    dustRunning = true;
  }

  if (!showBackground && dustRunning) {
    stopDust();
    dustRunning = false;
  }
}

function navigate(pathname, { replace = false } = {}) {
  const currentPath = `${location.pathname}${location.search}`;
  if (replace && pathname !== currentPath) {
    history.replaceState({}, '', pathname);
  }

  if (!replace && pathname !== currentPath) {
    history.pushState({}, '', pathname);
  }

  applyRoute(location.pathname);
}

function updateNavAuth() {
  const auth = hostState.getAuth();
  userLabel.textContent = auth?.user?.displayName || auth?.user?.email || '';
}

window.AppHost = {
  getState: (key) => hostState.getState(key),
  setState: (key, value) => hostState.setState(key, value),
  subscribe: (key, callback) => hostState.subscribe(key, callback),
  navigate,
  getAuth: () => hostState.getAuth(),
  setAuth: (auth) => hostState.setAuth(auth),
  getWs: () => hostState.getWs(),
  setWs: (wsClient) => hostState.setWs(wsClient),
};

document.querySelectorAll('[data-host-nav]').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    navigate(link.getAttribute('href'));
  });
});

const logoutButton = document.getElementById('host-logout-button');
logoutButton?.addEventListener('click', () => {
  hostState.setAuth(null);
  navigate('/login');
});

window.addEventListener('popstate', () => {
  applyRoute(location.pathname);
});

hostState.subscribe('auth', updateNavAuth);

applyRoute(location.pathname);
updateNavAuth();
