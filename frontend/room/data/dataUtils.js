export function calculateEdgePosition(sourceNode, targetNode) {
  const dx = targetNode.x - sourceNode.x;
  const dy = targetNode.y - sourceNode.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance === 0) {
    return { x: targetNode.x, y: targetNode.y };
  }

  const hw = targetNode.w / 2;
  const hh = targetNode.h / 2;
  // Find which edge of the rect the line intersects
  const t = Math.abs(dx) * hh > Math.abs(dy) * hw
    ? hw / Math.abs(dx)   // hits left or right edge
    : hh / Math.abs(dy);  // hits top or bottom edge

  return {
    x: targetNode.x - dx * t,
    y: targetNode.y - dy * t,
  };
}
