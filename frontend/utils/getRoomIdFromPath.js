export function getRoomIdFromPath() {
  const queryRoomId = new URLSearchParams(location.search).get('roomId');
  if (queryRoomId) {
    return queryRoomId;
  }

  const [, roomSegment, roomId] = location.pathname.split('/');
  if (roomSegment === 'room' && roomId) {
    return decodeURIComponent(roomId);
  }

  return '';
}
