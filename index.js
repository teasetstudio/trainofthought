import { updateGraph } from './frontend/modules/graph.js';
import { svgDrag, svgZoom } from './frontend/modules/dragZoomHelpers.js';
import { svg, setSvgSize } from './frontend/modules/svg.js';

svg.call(svgDrag);
svg.call(svgZoom);

window.addEventListener('resize', () => {
    setSvgSize()
});

updateGraph();
