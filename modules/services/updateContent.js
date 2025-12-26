import { data } from './data.js';
import { svgContainer } from '../svg.js';

export function updateContentModal(nodeId, currentValue) {
  // Create and show modal
  const modal = d3.select('body')
    .append('div')
    .attr('class', 'node-modal')
    .style('position', 'fixed')
    .style('top', '50%')
    .style('left', '50%')
    .style('transform', 'translate(-50%, -50%)')
    .style('background', 'white')
    .style('padding', '20px')
    .style('border-radius', '8px')
    .style('box-shadow', '0 2px 10px rgba(0,0,0,0.1)')
    .style('z-index', '1000');

  // Add modal content
  modal.append('h3').text('Edit Node Content');

  // Add textarea for node text
  const textarea = modal.append('textarea')
    .style('width', '100%')
    .style('min-height', '100px')
    .style('margin', '10px 0')
    .style('padding', '8px')
    .style('border', '1px solid #ddd')
    .style('border-radius', '4px')
    .style('resize', 'vertical')
    .property('value', currentValue || '');

  // Add buttons container
  const buttonContainer = modal.append('div')
    .style('display', 'flex')
    .style('justify-content', 'flex-end')
    .style('gap', '10px');

  // Add cancel button
  buttonContainer.append('button')
    .text('Cancel')
    .style('padding', '8px 16px')
    .style('border', '1px solid #ddd')
    .style('border-radius', '4px')
    .style('cursor', 'pointer')
    .on('click', () => {
      modal.remove();
      d3.select('body').on('click.node-modal', null);
    });

  // Add save button
  buttonContainer.append('button')
    .text('Save')
    .style('padding', '8px 16px')
    .style('background', '#4CAF50')
    .style('color', 'white')
    .style('border', 'none')
    .style('border-radius', '4px')
    .style('cursor', 'pointer')
    .on('click', () => {
      const nodeText = textarea.node().value;

      data.updateNode(nodeId, { content: nodeText });
      svgContainer.selectAll(".node-text")
        .filter(d => d.id === nodeId)
        .text(nodeText);
      
      modal.remove();
      d3.select('body').on('click.node-modal', null);
    });

  // Close modal when clicking outside
  d3.select('body')
    .on('click.node-modal', (event) => {
      if (!event.target.closest('.node-modal')) {
        modal.remove();
        d3.select('body').on('click.node-modal', null);
      }
    });
}