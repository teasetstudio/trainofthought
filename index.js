import { updateGraph } from './modules/graph.js';
import { svgDrag, svgZoom } from './modules/dragZoomHelpers.js';
import { svg, setSvgSize } from './modules/svg.js';

svg.call(svgDrag);
svg.call(svgZoom);

window.addEventListener('resize', () => {
    setSvgSize()
});

updateGraph();
