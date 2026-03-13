export function getRoomIdFromPath() {
  const parts = location.pathname.split('/');
  return parts[2]; // /room/{id}
}
