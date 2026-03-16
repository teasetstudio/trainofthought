import { verifyAccessToken } from './token.js';

export function authenticateHttpRequest(req, res, next) {
  const authorization = req.headers.authorization;
  const bearerPrefix = 'Bearer ';

  if (!authorization || !authorization.startsWith(bearerPrefix)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const token = authorization.slice(bearerPrefix.length).trim();

  try {
    req.auth = verifyAccessToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
}
