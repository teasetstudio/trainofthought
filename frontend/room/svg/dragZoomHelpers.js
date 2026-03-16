import { pendingNode } from '../pendingNode.js';
import { sendNodeCreate, sendNodeMove } from '../webSocketSendEvents.js';
import { getUserId, getRoomIdFromPath } from '../../utils/index.js';
import { svg, svgContainer } from './svg.js';
import { applyShiftConstraint, movePendingNode } from './pendingNodeHelpers.js';

const userId = getUserId();
const roomId = getRoomIdFromPath();

const initial = { x: 0, y: 0, cx: 0, cy: 0 };

const svgZoom = d3.zoom()
  .scaleExtent([0.1, 10])
  .on("zoom", (event) => {
    svgContainer.attr("transform", event.transform);
  });

const svgDrag = d3.drag()
  .on("start", svgDragstarted)
  .on("drag", svgDragged)
  .on("end", svgDragend)

function svgDragstarted(event) {
  // Store initial position in both SVG and container space
  initial.x = event.x;
  initial.y = event.y;
  const initialCoor = d3.pointer(event, svgContainer.node());
  initial.cx = initialCoor[0];
  initial.cy = initialCoor[1];
  if (event.sourceEvent.altKey) {
    pendingNode.create(event);

    if (pendingNode.nodeData) {
      sendNodeCreate(userId, roomId, pendingNode.nodeData, pendingNode.linkData);
    }
  }
}

function svgDragged(event) {
  if (pendingNode.isActive) {
    const coor = d3.pointer(event, svgContainer.node());
    const dx = coor[0] - initial.cx;
    const dy = coor[1] - initial.cy;

    const { x, y } = applyShiftConstraint(event.sourceEvent.shiftKey, dx, dy, initial.cx, initial.cy, coor[0], coor[1]);
    movePendingNode(x, y, userId, roomId);
  } else {
    const transform = d3.zoomTransform(svg.node());
    const dx = event.x - initial.x;
    const dy = event.y - initial.y;

    svg.call(svgZoom.translateBy, dx / transform.k, dy / transform.k);

    initial.x = event.x;
    initial.y = event.y;
  }
}

function svgDragend(event, d) {
  if (pendingNode.isActive) {
    pendingNode.finalize();
  }
}

export { svgDrag, svgZoom };
