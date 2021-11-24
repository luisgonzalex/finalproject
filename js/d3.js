// CONSTANTS
const greenSheen = "#88B7B5";
const purpleRhythm = "#847996";
const width = 1200;
const height = 800;
const center = { x: width / 2, y: height / 2 };
const padding = 2;

const forceStrength = 0.025;
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
      reducedExp: d.lcsi_reduced_exp,
      govtAid: d.assist_yn,
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

  const showTooltip = (d) => {
    // d3.select(this).attr("stroke", "black").style("stroke-width", "2");
    const style = document.getElementById(d.id).style;
    style.stroke = "black";
    style.strokeWidth = 2;

    var formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    });

    svg
      .append("text")
      .attr("id", "tooltip")
      .attr("x", 150)
      .attr("y", center.y)
      .text(`${formatter.format(d.value)} USD`)
      .style("font-size", "15px")
      .attr("alignment-baseline", "middle");
  };

  const hideTooltip = (d) => {
    // d3.select(this).attr("stroke", "black").style("stroke-width", "0");
    const style = document.getElementById(d.id).style;
    style.stroke = "black";
    style.strokeWidth = 0;
    d3.select("#tooltip").remove();
  };

  const bubblesE = bubbles
    .enter()
    .append("circle")
    .classed("bubble", true)
    .attr("id", (d) => d.id)
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
    .attr("stroke-width", 0.0)
    // .append("text")
    // .text((d) => {
    //   d.value >= 1000 ? `$${d.value} USD` : "";
    // });

    .on("mouseover", showTooltip)
    .on("mouseout", hideTooltip);

  bubbles = bubbles.merge(bubblesE);

  bubbles
    .transition()
    .ease(d3.easeBounce)
    .duration(1000)
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

  const forceXCombine = d3.forceX(center.x).strength(forceStrength);
  const forceXSeparate = (condition) => {
    return d3
      .forceX((d) => (d[condition] ? width / 4 : (3 * width) / 4))
      .strength(forceStrength);
  };
  const forceY = d3.forceY(center.y).strength(forceStrength);

  const simulation = d3
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
    .force("x", forceXCombine)
    .force("y", forceY)
    .on("tick", ticked);

  simulation.stop();

  simulation.nodes(nodes);

  simulation.force("x", forceXCombine);
  simulation.force("y", forceY);
  simulation.alpha(0.8).restart();

  d3.select("#original-btn").on("click", () => {
    removeSeparatingText();
    bubbles.enter().attr("cx", 0).attr("cy", 0);
    simulation.force("x", forceXCombine).alpha(0.8).restart();
  });

  d3.select("#reduced-btn").on("click", () => {
    simulation.force("x", forceXSeparate("reducedExp")).alpha(0.8).restart();
    addSeparatingText();
  });

  d3.select("#govt-btn").on("click", () => {
    simulation.force("x", forceXSeparate("govtAid")).alpha(0.8).restart();
    addSeparatingText();
  });

  const addSeparatingText = () => {
    svg
      .append("text")
      .attr("id", "yes-sep")
      .attr("x", width / 4)
      .attr("y", height - 100)
      .text("Yes")
      .style("font-size", "24px")
      .attr("alignment-baseline", "middle");

    svg
      .append("text")
      .attr("id", "no-sep")
      .attr("x", (3 * width) / 4)
      .attr("y", height - 100)
      .text("No")
      .style("font-size", "24px")
      .attr("alignment-baseline", "middle");
  };

  const removeSeparatingText = () => {
    d3.select("#yes-sep").remove();
    d3.select("#no-sep").remove();
  };

  // add legend
  svg
    .append("circle")
    .attr("cx", 200)
    .attr("cy", 130)
    .attr("r", 6)
    .style("fill", greenSheen);
  svg
    .append("circle")
    .attr("cx", 200)
    .attr("cy", 160)
    .attr("r", 6)
    .style("fill", purpleRhythm);
  svg
    .append("text")
    .attr("x", 220)
    .attr("y", 130)
    .text("Remittances")
    .style("font-size", "15px")
    .attr("alignment-baseline", "middle");
  svg
    .append("text")
    .attr("x", 220)
    .attr("y", 160)
    .text("No remittances")
    .style("font-size", "15px")
    .attr("alignment-baseline", "middle");

  // add title
  d3.select("svg")
    .append("text")
    .attr("x", function (d) {
      return width / 2;
    })
    .attr("y", 40)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .text("6-Month Health Spending in El Salvador (2021)");

  // add some buttons
  d3.select("#toolbar")
    .selectAll(".button")
    .on("click", function () {
      // Remove active class from all buttons
      d3.selectAll(".button").classed("active", false);
      // Find the button just clicked
      var button = d3.select(this);

      // Set it as the active button
      button.classed("active", true);

      // Get the id of the button
      var buttonId = button.attr("id");

      // Toggle the bubble chart based on
      // the currently clicked button.
      myBubbleChart.toggleDisplay(buttonId);
    });
};

// load csv data
d3.csv("../data/slv_health.csv", d3.autoType).then(function (data) {
  console.log(data);

  plotBubbleChart(data);
});
