import { data, calculateEdgePosition } from './services/data.js';
import { newNode } from './services/newNode.js';
import { svgContainer } from './svg.js';
import { WEB_SOCKET_URL } from '../const/index.js';

let ws;
let lastMoveSentAt = 0;

function ensureWebSocket() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    return ws;
  }

  ws = new WebSocket(WEB_SOCKET_URL);

  ws.addEventListener('message', (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (!msg || typeof msg !== 'object') return;

      if (msg.type === 'GRAPH') {
        if (typeof data.setGraph === 'function') {
          console.log('Setting graph', msg.nodes, msg.links);
          data.setGraph(msg.nodes, msg.links);
          updateGraph();
        }
      } else if (msg.type === 'NODE_MOVE') {
        applyRemoteNodeMove(msg);
      } else if (msg.type === 'NODE_CREATE') {
        applyRemoteNodeCreate(msg);
      }
    } catch {}
  });

  return ws;
}

function sendNodeMove(id, x, y) {
  const socket = ensureWebSocket();
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  
  const now = Date.now();
  if (now - lastMoveSentAt < 25) return;
  lastMoveSentAt = now;
  
  socket.send(JSON.stringify({ type: 'NODE_MOVE', id, x, y }));
}

function sendNodeCreate(node, link) {
  const socket = ensureWebSocket();
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  if (!node || typeof node !== 'object') return;
  socket.send(JSON.stringify({ type: 'NODE_CREATE', node, link }));
}

function applyRemoteNodeCreate(msg) {
  const { node, link } = msg;
  if (!node || typeof node !== 'object') return;
  if (typeof node.id !== 'number') return;

  const existing = data.findNodeById(node.id);
  if (!existing) {
    data.addNode(node);
  }

  if (link && typeof link === 'object') {
    const links = data.getLinks();
    const alreadyLinked = links.some(l => l.source === link.source && l.target === link.target);
    if (!alreadyLinked && typeof link.source === 'number' && typeof link.target === 'number') {
      data.addLink({ source: link.source, target: link.target });
    }
  }

  updateGraph();
}

function applyRemoteNodeMove(msg) {
  const { id, x, y } = msg;
  if (typeof id !== 'number' || typeof x !== 'number' || typeof y !== 'number') return;

  const nodes = data.getNodes();
  const links = data.getLinks();
  const node = data.findNodeById(id);
  if (!node) return;

  node.x = x;
  node.y = y;

  d3.select(`#id_node_${id}`).attr('cx', x).attr('cy', y);
  d3.select(`#id_node-back_${id}`).attr('cx', x).attr('cy', y);
  d3.select(`#id_node-text_${id}`).attr('x', x).attr('y', y);

  svgContainer.selectAll('.node-link')
    .data(links)
    .attr('x1', d => {
      const source = nodes.find(node => node.id === d.source);
      return source.x;
    })
    .attr('y1', d => {
      const source = nodes.find(node => node.id === d.source);
      return source.y;
    })
    .attr('x2', d => {
      const source = nodes.find(node => node.id === d.source);
      const target = nodes.find(node => node.id === d.target);
      return calculateEdgePosition(source, target).x;
    })
    .attr('y2', d => {
      const source = nodes.find(node => node.id === d.source);
      const target = nodes.find(node => node.id === d.target);
      return calculateEdgePosition(source, target).y;
    });
}

function updateGraph() {
  ensureWebSocket();
  const nodes = data.getNodes();
  const links = data.getLinks();

  svgContainer.selectAll(".node-link")
    .data(links, d => `${d.source}_${d.target}`)
    .join(
      enter => enter.append("line").attr("class", "node-link"),
      update => update,
      exit => exit.remove()
    )
    .attr("id", d => `id_node-link_${d.source}_${d.target}`)
    // Optimise 4x find + x2 find + x2 calculateEdgePosition
    .attr("x1", d => {
      const source = nodes.find(node => node.id === d.source);
      return source.x;
    })
    .attr("y1", d => {
      const source = nodes.find(node => node.id === d.source);
      return source.y;
    })
    .attr("x2", d => {
      const source = nodes.find(node => node.id === d.source);
      const target = nodes.find(node => node.id === d.target);
      return calculateEdgePosition(source, target).x;
    })
    .attr("y2", d => {
      const source = nodes.find(node => node.id === d.source);
      const target = nodes.find(node => node.id === d.target);
      return calculateEdgePosition(source, target).y;
    });

  // Just decaration
  svgContainer.selectAll(".node-back")
    .data(nodes, d => d.id)
    .join(
      enter => enter.append("circle").attr("class", "node-back"),
      update => update,
      exit => exit.remove()
    )
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("id", d => `id_node-back_${d.id}`)
    .attr("r", d => d.r)

  svgContainer.selectAll(".node-text")
    .data(nodes, d => d.id)
    .join(
      enter => enter.append("text").attr("class", "node-text"),
      update => update,
      exit => exit.remove()
    )
    .attr("x", d => d.x)
    .attr("y", d => d.y)
    .attr("id", d => `id_node-text_${d.id}`)
    .attr("text-anchor", "middle")
    .attr("alignment-baseline", "middle")
    .text(d => d.content);

  svgContainer.selectAll(".node")
    .data(nodes, d => d.id)
    .join(
      enter => enter.append("circle").attr("class", "node"),
      update => update,
      exit => exit.remove()
    )
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("id", d => `id_node_${d.id}`)
    .attr("r", d => d.r)
    .call(d3.drag()
      .on("start", function(event, d) {
        if (event.sourceEvent.altKey && newNode.nodeSvg === null) {
          newNode.create(event, d);

          if (newNode.nodeData) {
            sendNodeCreate(newNode.nodeData, newNode.linkData);
          }
        }

        if (newNode.nodeSvg) {
          d3.select(`#id_node-back_${newNode.nodeData.id}`).raise();
          d3.select(`#id_node-text_${newNode.nodeData.id}`).raise();
          newNode.nodeSvg.raise().classed("active", true);
          newNode.linkSvg.lower();
        } else {
          // d3.select(`#id_node-back_${d.id}`).raise();
          d3.select(`#id_node-text_${d.id}`).raise();
          d3.select(this).raise().classed("active", true);
        }
        // Store initial position
        d.initialX = d.x;
        d.initialY = d.y;
      })
      .on("drag", function(event, d) {
        const dx = event.x - d.initialX;
        const dy = event.y - d.initialY;
        let x = 0;
        let y = 0;

        // Shift
        if (event.sourceEvent.shiftKey) {
          // Shift key is pressed: restrict movement to horizontal or vertical
          if (Math.abs(dx) > Math.abs(dy)) {
            // Horizontal movement
            x = d.initialX + dx;
            y = d.initialY;  // Maintain vertical position
          } else {
            // Vertical movement
            x = d.initialX;  // Maintain horizontal position
            y = d.initialY + dy;
          }
        } else {
          // Shift key is not pressed: free movement
          x = event.x;
          y = event.y;
        }

        if (newNode.nodeSvg && newNode.nodeData) {
          newNode.nodeData.x = x;
          newNode.nodeData.y = y;
          newNode.nodeSvg.attr("cx", x).attr("cy", y);
          d3.select(`#id_node-back_${newNode.nodeData.id}`).attr("cx", x).attr("cy", y);
          d3.select(`#id_node-text_${newNode.nodeData.id}`).attr("x", x).attr("y", y);

          sendNodeMove(newNode.nodeData.id, x, y);

          if (newNode.linkSvg && newNode.linkData) {
            const parentNode = data.findNodeById(newNode.linkData.source)
            const nodeEdgePos = data.calculateEdgePosition(parentNode, newNode.nodeData)
            newNode.linkSvg
              .attr("x1", parentNode.x)
              .attr("y1", parentNode.y)
              .attr("x2", nodeEdgePos.x)
              .attr("y2", nodeEdgePos.y);
          }
        } else {
          d.x = x;
          d.y = y;
          d3.select(this).attr("cx", x).attr("cy", y);
          d3.select(`#id_node-text_${d.id}`).attr("x", x).attr("y", y)
          d3.select(`#id_node-back_${d.id}`).attr("cx", x).attr("cy", y)

          sendNodeMove(d.id, x, y);

          d3.selectAll(".node-link").attr("x1", d => {
              const source = nodes.find(node => node.id === d.source);
              return source.x;
            })
            .attr("y1", d => {
                const source = nodes.find(node => node.id === d.source);
                return source.y;
            })
            .attr("x2", d => {
              const source = nodes.find(node => node.id === d.source);
              const target = nodes.find(node => node.id === d.target);
              return calculateEdgePosition(source, target).x;
            })
            .attr("y2", d => {
              const source = nodes.find(node => node.id === d.source);
              const target = nodes.find(node => node.id === d.target);
              return calculateEdgePosition(source, target).y;
            })
        }
      })
      .on("end", function(event, d) {
        if (newNode.nodeSvg) {
          newNode.finalizeNodeCreation();
        } else {
          d3.select(this).classed("active", false);
        }
  }));
}

export { updateGraph };
