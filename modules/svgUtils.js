import { data } from './services/data.js';
import { svgContainer } from "./svg.js";

export function updateNodeContent(nodeId, newContent) {
  data.updateNodeContent(nodeId, newContent);
  svgContainer.selectAll(".node-text")
    .filter(d => d.id === nodeId)
    .text(newContent);
}