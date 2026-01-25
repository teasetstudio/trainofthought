import { newNode } from './services/newNode.js';
import { svgContainer } from './svg.js';

const initial = { x: 0, y: 0 };
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
  // Store initial position
  initial.x = event.x;
  initial.y = event.y;
  const transform = d3.zoomTransform(svgContainer.node());
  if (transform.k !== shift.k) {
    shift.x = 0;
    shift.y = 0;
    shift.k = transform.k;
  }
  if (event.sourceEvent.altKey) {
    newNode.create(event);
  }
}

function svgDragged(event) {
  if (newNode.nodeSvg && newNode.nodeData) {
    const dx = event.x - initial.x;
    const dy = event.y - initial.y;
    const coor = d3.pointer(event, svgContainer.node());
    let x = coor[0];
    let y = coor[1];
    
    if (event.sourceEvent.shiftKey) {
      if (Math.abs(dx) > Math.abs(dy)) {
        y = initial.y;
      } else {
        x = initial.x;
      }
    }
    newNode.nodeData.x = x;
    newNode.nodeData.y = y;
    newNode.nodeSvg.attr("cx", x).attr("cy", y);
    d3.select(`#id_node-text_${newNode.nodeData.id}`).attr("x", x).attr("y", y);
    d3.select(`#id_node-back_${newNode.nodeData.id}`).attr("cx", x).attr("cy", y);
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
  if (newNode.nodeSvg && newNode.nodeData) {
    newNode.finalizeNodeCreation();
  } else {
    const dx = event.x - initial.x
    const dy = event.y - initial.y
    shift.x += dx
    shift.y += dy
  }
}

export { svgDrag, svgZoom };
