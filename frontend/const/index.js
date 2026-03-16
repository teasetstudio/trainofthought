export const HOST = window.location.host;

const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
export const WEB_SOCKET_URL = `${protocol}://${HOST}/ws`;