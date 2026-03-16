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

export function getAuthSession() {
  return parseAuthSession(localStorage.getItem(AUTH_STORAGE_KEY));
}

export function setAuthSession(session) {
  if (!session || typeof session !== 'object') return;
  if (typeof session.token !== 'string' || session.token.length === 0) return;
  if (!session.user || typeof session.user !== 'object') return;

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
    token: session.token,
    user: session.user,
  }));
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function getAuthToken() {
  return getAuthSession()?.token || '';
}

export function getAuthUser() {
  return getAuthSession()?.user || null;
}

export function isAuthenticated() {
  return getAuthToken().length > 0;
}

export function requireAuth(redirectPath = '/login') {
  if (isAuthenticated()) return true;
  window.location.replace(redirectPath);
  return false;
}

export function redirectAuthenticated(path = '/rooms') {
  if (!isAuthenticated()) return false;
  window.location.replace(path);
  return true;
}

export async function fetchWithAuth(url, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = getAuthToken();

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const hasBody = options.body !== undefined;
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  if (hasBody && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearAuthSession();
  }

  return response;
}
