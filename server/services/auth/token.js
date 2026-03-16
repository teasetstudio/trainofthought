import jwt from 'jsonwebtoken';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('Missing JWT_SECRET environment variable');
  }
  return secret;
}

function getJwtExpiresIn() {
  return process.env.JWT_EXPIRES_IN || '7d';
}

export function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      displayName: user.displayName,
    },
    getJwtSecret(),
    { expiresIn: getJwtExpiresIn() },
  );
}

export function verifyAccessToken(token) {
  const payload = jwt.verify(token, getJwtSecret());

  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid token payload');
  }

  return {
    id: String(payload.sub),
    email: String(payload.email || ''),
    displayName: String(payload.displayName || ''),
  };
}
