import { pendingNode } from '../pendingNode.js';
import { sendNodeCreate, sendNodeMove } from '../webSocketSendEvents.js';
import { getUserId, getRoomIdFromPath } from '../../utils/index.js';
import { svgContainer } from './svg.js';
import { applyShiftConstraint, movePendingNode } from './pendingNodeHelpers.js';

const userId = getUserId();
const roomId = getRoomIdFromPath();

const initial = { x: 0, y: 0, cx: 0, cy: 0 };
const shift = { x: 0, y: 0, k: 1 };

const svgZoom = d3.zoom()
  .scaleExtent([0.1, 10])
  .on("zoom", (event) => {
    if (event.transform.k !== shift.k) {
      shift.k = event.transform.k
    }
    const translate = `translate(${event.transform.x+shift.x}, ${event.transform.y+shift.y}) scale(${event.transform.k})`
    svgContainer.attr("transform", translate);
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
  const transform = d3.zoomTransform(svgContainer.node());
  if (transform.k !== shift.k) {
    shift.x = 0;
    shift.y = 0;
    shift.k = transform.k;
  }
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
    const transform = d3.zoomTransform(svgContainer.node());
    const dx = shift.x + event.x - initial.x;
    const dy = shift.y + event.y - initial.y;
    svgContainer.attr("transform", function () {
      return `translate(${transform.x + dx}, ${transform.y + dy}) scale(${transform.k})`;
    });
  }
}

function svgDragend(event, d) {
  if (pendingNode.isActive) {
    pendingNode.finalize();
  } else {
    const dx = event.x - initial.x
    const dy = event.y - initial.y
    shift.x += dx
    shift.y += dy
  }
}

export { svgDrag, svgZoom };
