// CONSTANTS
const greenSheen = "#88B7B5";
const purpleRhythm = "#847996";
const width = 1200;
const height = 800;
const center = { x: width / 2, y: height / 2 };
const padding = 2;

const forceStrength = 0.015;
const initialRadius = 1;

const createNodes = (data) => {
  const maxVal = d3.max(data, (d) => d.exp_6months_health);

  // set up scale for bubbles
  var radiusScale = d3
    .scaleLinear()
    // .scalePow()
    // .exponent(0.7)
    .range([2, 60])
    .domain([0, maxVal]);

  // use only data necessary for nodes
  var nodes = data.map(function (d) {
    return {
      id: d.rsp_id,
      radius: radiusScale(d.exp_6months_health_USD),
      value: d.exp_6months_health_USD,
      remittances: d.remittances_yn,
      rural: d.rural_urban,
      x: Math.random() * width,
      y: Math.random() * height,
    };
  });

  nodes.sort(function (a, b) {
    return b.value - a.value;
  });

  return nodes;
};

const plotBubbleChart = (data) => {
  const svg = d3
    .select("#bubble-chart")
    .append("svg")
    .attr("viewBox", [0, 0, width, height]);

  const nodes = createNodes(data);

  var bubbles = svg.selectAll(".bubble").data(nodes, (d) => {
    d.id;
  });

  const bubblesE = bubbles
    .enter()
    .append("circle")
    .classed("bubble", true)
    .attr("r", initialRadius)
    .attr("fill", function (d) {
      return d.remittances ? greenSheen : purpleRhythm;
    })
    // .style("stroke", function (d) {
    //   if (d.value <= 1) return fillColor(d.name);
    // })
    .style("stroke-width", function (d) {
      if (d.value <= 1) return 0.9;
    })
    // .attr('stroke', function (d) { return d3.rgb(fillColor(d.name)).darker(); })
    .attr("stroke-width", 0.0);
  // .append("text")
  // .text((d) => {
  //   d.value >= 1000 ? `$${d.value} USD` : "";
  // });

  // .on("mouseover", showDetail)
  // .on("mouseout", hideDetail);

  bubbles = bubbles.merge(bubblesE);

  bubbles
    .transition()
    .ease(d3.easeBounce)
    .duration(1)
    .attr("r", function (d) {
      // console.log(d.radius);
      return d.radius;
    });

  const ticked = () => {
    bubbles
      .attr("cx", function (d) {
        return d.x;
      })
      .attr("cy", function (d) {
        return d.y;
      });
  };

  var simulation = d3
    .forceSimulation()
    .velocityDecay(0.25)
    .force(
      "collide",
      d3
        .forceCollide()
        .radius(function (d) {
          return d.radius + padding;
        })
        .strength(0.25)
    )
    .force("x", d3.forceX().strength(forceStrength).x(center.x))
    .force("y", d3.forceY().strength(forceStrength).y(center.y))
    .on("tick", ticked);

  simulation.stop();

  simulation.nodes(nodes);

  simulation.force("x", d3.forceX().strength(forceStrength).x(center.x));
  simulation.force("y", d3.forceY().strength(forceStrength).y(center.y));
  simulation.alpha(0.8).restart();

  d3.select("svg")
    .append("text")
    .attr("x", function (d) {
      return width / 2;
    })
    .attr("y", 40)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .text("6-Month Health Spending in El Salvador (2021)");
};

// load csv data
d3.csv("../data/slv_health.csv", d3.autoType).then(function (data) {
  console.log(data);

  plotBubbleChart(data);
});
