export function getUserId() {
  let id = localStorage.getItem('userId');
  if (typeof id === 'string' && id.length > 0) {
    return id;
  }

  // Always returns a string
  id = crypto.randomUUID(); // e.g. "550e8400-e29b-41d4-a716-446655440000"

  localStorage.setItem('userId', id);
  return id;
}
