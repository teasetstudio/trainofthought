const scale = d3.scaleOrdinal(d3.schemeCategory10)
const color = d => scale(d.name[0])

let height = 400
let width = 400

const svg = d3.select("#graph").append("svg")
	.attr("viewBox", [-width / 2, -height / 2, width, height])

axios.get('https://api.github.com/gists/9c9c697baa3a0dbb6861485ca3a3a3f9')
  .then(response => {

    let filename = 'us_preamble_similarity_graph.json'
    let data = JSON.parse(response.data.files[filename].content)

    let minSimilarity = 0.5
    data.links = data.links.filter(link => {
      return link.similarity > minSimilarity
    })
    
    const links = data.links
    const nodes = data.nodes
    
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.name))
      .force("charge", d3.forceManyBody().strength(-70))
      .force("x", d3.forceX())
      .force("y", d3.forceY())

    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart()
      event.subject.fx = event.subject.x
      event.subject.fy = event.subject.y
    }

    function dragged(event) {
      event.subject.fx = event.x
      event.subject.fy = event.y
    }

    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0)
      event.subject.fx = null;
      event.subject.fy = null;
    }

    let drag = d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended)

    const link = svg.append("g")
      .attr("class", "link")
      .selectAll("line")
      .data(links)
      .join("line")
        .attr("stroke-width", d => d.similarity * 5)
        .attr("stroke-opacity", d => ((d.similarity - minSimilarity) * (1/minSimilarity) + 0.1))

    const node = svg.append("g")
      .selectAll(".node")
      .data(nodes)
      .join("g")
        .attr("class", "node")
        .call(drag)
        
    node.append("circle")
      .attr("r", 5)
      .attr("fill", color)

    node.append("text")
      .text(function(d) {
        return d.name;
      })
      .attr('x', 6)
      .attr('y', 3)
			.append("title")
      	.text(d => d.name)

    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y)
        
      node.attr("transform", d => `translate(${d.x}, ${d.y})`)
    })
  })