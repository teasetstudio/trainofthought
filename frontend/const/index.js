export const HOST = "localhost:8080";

const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
export const WEB_SOCKET_URL = `${protocol}://${HOST}/ws`;