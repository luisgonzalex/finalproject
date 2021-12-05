// CONSTANTS
const greenSheen = "#88B7B5";
const purpleRhythm = "#847996";
const width = 1200;
const height = 800;
const heightOffset = 50;
const center = { x: width / 2, y: height / 2 - heightOffset };
const padding = 2.5;

const forceStrength = 0.025;
const initialRadius = 0;
const radiusLimit = 80;

const createNodes = (data) => {
  const maxVal = d3.max(data, (d) => d.exp_6months_health);

  // set up scale for bubbles
  var radiusScale = d3
    .scaleLinear()
    // .scalePow()
    // .exponent(0.7)
    .range([2, radiusLimit])
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
      hhSize: d.hh_size,
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
    .attr("id", "svg")
    .attr("viewBox", [0, 0, width, height]);

  const nodes = createNodes(data);

  var bubbles = svg.selectAll(".bubble").data(nodes, (d) => {
    d.id;
  });

  // adding tooltip logic

  // -1- Create a tooltip div that is hidden by default:
  var tooltip = d3
    .select("#bubble-chart")
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("background-color", "black")
    .style("border-radius", "5px")
    .style("padding", "10px")
    .style("color", "white");

  // -2- Create 3 functions to show / update (when mouse move but stay on same circle) / hide the tooltip
  var showTooltip = function (d) {
    var formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    });
    tooltip.transition().duration(200);
    tooltip
      .style("opacity", 0.9)
      .style("background-color", d.remittances ? greenSheen : purpleRhythm)
      .html(
        `<span id="tooltip-text">This household of <span id='hh'>${
          d.hhSize
        }</span> spent <h2>${formatter.format(d.value)} USD</h2>
         on healthcare.</span>`
      )
      .style("left", d3.event.pageX + 30 + "px")
      .style("top", d3.event.pageY + 30 + "px");

    const style = document.getElementById(d.id).style;
    style.stroke = "black";
    style.strokeWidth = 2;
  };
  var moveTooltip = function (d) {
    tooltip
      .style("left", d3.mouse(this)[0] + 30 + "px")
      .style("top", d3.mouse(this)[1] + 30 + "px");
  };
  var hideTooltip = function (d) {
    tooltip.transition().duration(200).style("opacity", 0);
    const style = document.getElementById(d.id).style;
    style.stroke = "black";
    style.strokeWidth = 0;
  };

  // end tooltip logic

  const threshold = 1;

  const bubblesE = bubbles
    .enter()
    .append("circle")
    .classed("bubble", true)
    .attr("id", (d) => d.id)
    .attr("r", initialRadius)
    .attr("fill", function (d) {
      return d.remittances ? greenSheen : purpleRhythm;
    })
    .style("fill", function (d) {
      if (d.value <= threshold) return "#fff";
    })
    .style("stroke", function (d) {
      if (d.value <= threshold)
        return d.remittances ? greenSheen : purpleRhythm;
    })
    .style("stroke-width", function (d) {
      if (d.value <= threshold) return 0.9;
    })
    .on("mouseover", showTooltip)
    .on("mouseleave", hideTooltip);

  bubbles = bubbles.merge(bubblesE);

  bubbles
    .transition()
    .ease(d3.easeBounce)
    .duration(0.5)
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
    .on("tick", ticked);
  simulation.nodes(nodes);
  simulation.force("x", forceXCombine);
  simulation.force("y", forceY);
  simulation.alpha(0.8).restart();
  // simulation.stop();

  const handleLoad = (slideNumber) => {
    if (currentSlide === slideNumber) {
      return;
    }
    currentSlide = slideNumber;

    const moveBubbleChart = (sn) => {
      document
        .getElementById(`row-${sn - 1}`)
        .appendChild(document.getElementById("bubble-chart"));
    };
    moveBubbleChart(slideNumber);
    if (slideNumber === 2) {
      removeSeparatingText();
      simulation.force("x", forceXCombine);
      simulation.force("y", forceY);
      simulation.alpha(0.8).restart();
    } else if (slideNumber === 3) {
      simulation.force("x", forceXSeparate("reducedExp")).alpha(0.8).restart();
      addSeparatingText();
    } else if (slideNumber === 4) {
      simulation.force("x", forceXSeparate("govtAid")).alpha(0.8).restart();
      addSeparatingText();
    }
  };
  // handle the slide on load
  var currentSlide = window.location.hash.split("=")[1];
  handleLoad(currentSlide);

  // set up a listener for future slide changes
  window.ws.el.addEventListener("ws:slide-change", (e) => {
    const currentSlide = e.detail.currentSlide;
    if (currentSlide === 1) {
      return;
    }
    handleLoad(currentSlide);
  });

  // d3.select("#original-btn").on("click", () => {});

  // d3.select("#reduced-btn").on("click", () => {
  //   simulation.force("x", forceXSeparate("reducedExp")).alpha(0.8).restart();
  //   addSeparatingText();
  // });

  // d3.select("#govt-btn").on("click", () => {
  //   simulation.force("x", forceXSeparate("govtAid")).alpha(0.8).restart();
  //   addSeparatingText();
  // });

  const addSeparatingText = () => {
    svg
      .append("text")
      .attr("id", "yes-sep")
      .attr("x", width / 4)
      .attr("y", height * 0.02)
      .text("Yes")
      .style("font-size", "24px")
      .attr("alignment-baseline", "middle");

    svg
      .append("text")
      .attr("id", "no-sep")
      .attr("x", (3 * width) / 4)
      .attr("y", height * 0.02)
      .text("No")
      .style("font-size", "24px")
      .attr("alignment-baseline", "middle");
  };

  const removeSeparatingText = () => {
    svg.selectAll("#yes-sep").remove();
    svg.selectAll("#no-sep").remove();
  };

  // // add legend
  // svg
  //   .append("circle")
  //   .attr("cx", 200)
  //   .attr("cy", 130)
  //   .attr("r", 6)
  //   .style("fill", greenSheen);
  // svg
  //   .append("circle")
  //   .attr("cx", 200)
  //   .attr("cy", 160)
  //   .attr("r", 6)
  //   .style("fill", purpleRhythm);
  // svg
  //   .append("text")
  //   .attr("x", 220)
  //   .attr("y", 130)
  //   .text("Remittances")
  //   .style("font-size", "15px")
  //   .attr("alignment-baseline", "middle");
  // svg
  //   .append("text")
  //   .attr("x", 220)
  //   .attr("y", 160)
  //   .text("No remittances")
  //   .style("font-size", "15px")
  //   .attr("alignment-baseline", "middle");

  // // add title
  // d3.select("svg")
  //   .append("text")
  //   .attr("x", function (d) {
  //     return width / 2;
  //   })
  //   .attr("y", 40)
  //   .attr("text-anchor", "middle")
  //   .attr("dominant-baseline", "middle")
  //   .text("6-Month Health Spending in El Salvador (2021)");
};

// load csv data
d3.csv("./data/slv_health.csv", d3.autoType).then(function (data) {
  console.log(data);

  plotBubbleChart(data);
});
