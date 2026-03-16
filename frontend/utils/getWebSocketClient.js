import { WEB_SOCKET_URL } from '../const/index.js';
import { clearAuthSession, getAuthToken } from './authState.js';

let ws;

function buildWebSocketUrl() {
  const token = getAuthToken();
  if (!token) return null;

  const url = new URL(WEB_SOCKET_URL);
  url.searchParams.set('token', token);
  return url.toString();
}

export function resetWebSocketClient() {
  if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) {
    ws.close();
  }
  ws = undefined;
}

export function getWebSocketClient() {
  const wsUrl = buildWebSocketUrl();

  if (!wsUrl) {
    return Promise.reject(new Error('Missing auth token'));
  }

  if (ws?.readyState === WebSocket.OPEN) {
    return Promise.resolve(ws);
  }

  if (ws?.readyState !== WebSocket.CONNECTING) {
    ws = new WebSocket(wsUrl);

    ws.addEventListener('close', (event) => {
      if (event.code === 4001) {
        clearAuthSession();
      }
      ws = undefined;
    }, { once: true });
  }

  return new Promise((resolve, reject) => {
    const ac = new AbortController();
    const { signal } = ac;

    ws.addEventListener('open', () => {
      console.log('WebSocket connected');
      ac.abort();
      resolve(ws);
    }, { signal });

    ws.addEventListener('error', (err) => {
      console.log('WebSocket connecting failed');
      ac.abort();
      ws = undefined;
      reject(err);
    }, { signal });
  });
}
