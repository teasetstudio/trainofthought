import { updateGraph } from './frontend/modules/graph.js';
import { svgDrag, svgZoom } from './frontend/modules/dragZoomHelpers.js';
import { svg, setSvgSize } from './frontend/modules/svg.js';
import { getUserId } from './frontend/utils/getUserId.js';

function getRoomIdFromPath() {
  const parts = location.pathname.split('/');
  return parts[2]; // /room/{id}
}

const ROOM_ID = getRoomIdFromPath();
const userId = getUserId();
if (!ROOM_ID) {
  alert('Invalid room');
  throw new Error('Missing room id');
}

// document.getElementById('room-title').textContent =
//   `Room ${ROOM_ID}`;



// SVG
svg.call(svgDrag);
svg.call(svgZoom);

window.addEventListener('resize', () => {
    setSvgSize()
});

updateGraph();
