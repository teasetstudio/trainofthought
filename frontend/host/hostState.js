const AUTH_STORAGE_KEY = 'train-of-thought.auth';

function parseAuthSession(rawValue) {
  if (!rawValue) return null;

  try {
    const parsed = JSON.parse(rawValue);

    if (!parsed || typeof parsed !== 'object') return null;
    if (typeof parsed.token !== 'string' || parsed.token.length === 0) return null;
    if (!parsed.user || typeof parsed.user !== 'object') return null;
    if (typeof parsed.user.id !== 'string' || parsed.user.id.length === 0) return null;

    return {
      token: parsed.token,
      user: parsed.user,
    };
  } catch {
    return null;
  }
}

const state = {
  auth: parseAuthSession(localStorage.getItem(AUTH_STORAGE_KEY)),
  currentRoom: null,
  peers: [],
  wsClient: null,
  uiFlags: {},
};

const listeners = new Map();

function emit(key, value) {
  const callbacks = listeners.get(key);
  if (!callbacks) return;
  callbacks.forEach((callback) => callback(value));
}

function setState(key, value) {
  state[key] = value;

  if (key === 'auth') {
    if (value) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(value));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }

  emit(key, value);
}

function getState(key) {
  return state[key];
}

function subscribe(key, callback) {
  if (!listeners.has(key)) {
    listeners.set(key, new Set());
  }

  listeners.get(key).add(callback);

  return () => {
    listeners.get(key)?.delete(callback);
  };
}

function getAuth() {
  return getState('auth');
}

function setAuth(auth) {
  setState('auth', auth || null);
}

function getWs() {
  return getState('wsClient');
}

function setWs(wsClient) {
  setState('wsClient', wsClient || null);
}

export const hostState = {
  getState,
  setState,
  subscribe,
  getAuth,
  setAuth,
  getWs,
  setWs,
};
