const svg = d3.select("body")
  .append("svg")
  .style("border", "2px solid blue");

setSvgSize()

const svgContainer = svg.append("g");

svg.append("defs").append("marker")
  .attr("id", "arrow")
  .attr("viewBox", "0 -5 10 10")
  .attr("refX", 10)
  .attr("refY", 0)
  .attr("markerWidth", 6)
  .attr("markerHeight", 6)
  .attr("orient", "auto")
  .append("path")
  .attr("d", "M0,-5L10,0L0,5")

function setSvgSize() {
  svg.attr("width", window.innerWidth - 10)
    .attr("height", window.innerHeight - 10);
}

export { svg, svgContainer, setSvgSize };
