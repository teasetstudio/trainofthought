import { WEB_SOCKET_URL } from '../const/index.js';

let ws;

export function getWebSocketClient() {
  if (ws?.readyState === WebSocket.OPEN) {
    return Promise.resolve(ws);
  }

  if (ws?.readyState !== WebSocket.CONNECTING) {
    ws = new WebSocket(WEB_SOCKET_URL);
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
      reject(err);
    }, { signal });
  });
}