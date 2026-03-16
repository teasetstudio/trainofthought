import { verifyAccessToken } from './token.js';

export function getWsTokenFromRequest(req) {
  const host = req.headers.host || 'localhost';
  const url = new URL(req.url || '/', `http://${host}`);
  return url.searchParams.get('token')?.trim() || '';
}

export function authenticateWsRequest(req) {
  const token = getWsTokenFromRequest(req);
  if (!token) {
    return null;
  }

  try {
    return verifyAccessToken(token);
  } catch {
    return null;
  }
}
