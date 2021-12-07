// CONSTANTS
const greenSheen = "#88B7B5";
const purpleRhythm = "#847996";
const black = "#fffffff";

const width = 1200;
const height = 800;
const heightOffset = 50;
const offset = 100;
const center = { x: width / 2, y: height / 2 - heightOffset };
const padding = 2.5;

const initialRadius = 0;
const radiusLimit = 80;
const forceStrength = 0.025;

const slideThresh = 3;
const slideAll = 3;
const slideRemittances = 4;
const slideHealthPriority = 5;
const slideGovtAid = 6;
const slideBoundary = 6;

const normalOpacity = 0.9;
const deFocusOpacity = 0.1;

// BEGIN HELPER METHODS
const isOOB = (s) => {
  return !(s >= slideThresh && s <= slideBoundary);
};

const createNodes = (data) => {
  const maxVal = d3.max(data, (d) => d.exp_6months_health_USD);

  // set up scale for bubbles
  var radiusScale = d3
    .scaleLinear()
    .range([2, radiusLimit])
    .domain([0, maxVal]);

  // use only data necessary for nodes
  var nodes = data.map(function (d) {
    return {
      id: d.rsp_id,
      radius: radiusScale(d.exp_6months_health_USD),
      value: d.exp_6months_health_USD,
      remittances: d.remittances_yn,
      aid: d.govt_ngo_help,
      healthPriority: d.health_top_priority,
      hhSize: d.hh_size,
      x: Math.random() * (width - offset),
      y: Math.random() * (height - offset),
    };
  });

  nodes.sort(function (a, b) {
    return b.value - a.value;
  });

  return nodes;
};

// END HELPER METHODS

// MAIN DRIVER CODE
const plotBubbleChart = (data) => {
  // BEGIN TOOLTIP CODE
  // adding tooltip logic

  // -1- Create a tooltip div that is hidden by default:
  var tooltip = d3
    .select("#bubble-chart")
    .append("div")
    .style("opacity", 0.6)
    .attr("class", "tooltip")
    .style("background-color", "black")
    .style("border-radius", "5px")
    .style("padding", "10px")
    .style("color", "white")
    .style("visibility", "hidden");

  // -2- Create 3 functions to show / update (when mouse move but stay on same circle) / hide the tooltip
  var showTooltip = function (d) {
    const color = black;
    var formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    });
    tooltip
      .style("visibility", "visible")
      .html(
        `<span id="tooltip-text">This household of <span id='hh'>${
          d.hhSize
        }</span> spent <h2>${formatter.format(d.value)} USD</h2>
         on healthcare.</span>`
      )
      .style("left", d3.event.pageX + 30 + "px")
      .style("top", d3.event.pageY + 30 + "px");
  };
  var hideTooltip = function (d) {
    tooltip.style("visibility", "hidden");
  };

  // end tooltip logic
  // END TOOLTIP CODE

  const svg = d3
    .select("#bubble-chart")
    .append("svg")
    .attr("id", "svg")
    .attr("viewBox", [0, 0, width, height]);

  const nodes = createNodes(data);

  var bubbles = svg.selectAll(".bubble").data(nodes, (d) => {
    d.id;
  });

  const bubblesE = bubbles
    .enter()
    .append("circle")
    .classed("bubble", true)
    .attr("id", (d) => d.id)
    .attr("r", initialRadius)
    .attr("fill", function (d) {
      return greenSheen;
    })
    .attr("opacity", 0.9)
    .on("mouseover", showTooltip)
    .on("mouseleave", hideTooltip);

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
    .velocityDecay(0.15)
    .force(
      "collide",
      d3
        .forceCollide()
        .radius(function (d) {
          return d.radius + padding;
        })
        .strength(0.75)
    )
    .on("tick", ticked);
  simulation.nodes(nodes);

  bubbles = bubbles.merge(bubblesE);

  const handleSlideChange = (slideNumber) => {
    if (vizStarted && prevSlide === slideNumber) return;
    if (!vizStarted && !isOOB(slideNumber)) {
      vizStarted = true;
      bubbles
        .transition()
        .ease(d3.easeBounce)
        .duration(100)
        .attr("r", function (d) {
          return d.radius;
        });
    }
    if (isOOB(slideNumber)) return;
    prevSlide = slideNumber;

    // if the last viz slide we were on is the same, do nothing

    // change the slide to the correct place
    document
      .getElementById(`row-${slideNumber - slideThresh + 1}`)
      .appendChild(document.getElementById("bubble-chart"));

    bubbles
      .transition()
      .duration(3000)
      .attr("opacity", (d) => {
        return normalOpacity;
      });

    // add the appropriate force
    if (slideNumber === slideAll) {
      simulation.force("x", forceXCombine);
      simulation.force("y", forceY);
      simulation.alpha(0.8).restart();
    } else if (slideNumber == slideRemittances) {
      simulation.force("x", forceXSeparate("remittances"));
      simulation.force("y", forceY);
      simulation.alpha(0.8).restart();
    } else if (slideNumber == slideHealthPriority) {
      bubbles
        .transition()
        .duration(3000)
        .attr("opacity", (d) => {
          return d.healthPriority ? normalOpacity : deFocusOpacity;
        });
    } else if (slideNumber == slideGovtAid) {
      bubbles
        .transition()
        .duration(3000)
        .attr("opacity", (d) => {
          return d.aid ? normalOpacity : deFocusOpacity;
        });
    }
  };

  var vizStarted = false;
  // handle the slide on load (will be last slide with a visulization)
  var prevSlide = parseInt(window.location.hash.split("=")[1]);
  handleSlideChange(prevSlide);
  // set up a listener for future slide changes
  window.ws.el.addEventListener("ws:slide-change", (e) => {
    const currentSlide = e.detail.currentSlide;
    handleSlideChange(currentSlide);
  });

  window.addEventListener("scroll", (e) => {
    simulation.stop();
  });
};

// load csv data
d3.csv("./data/new_data.csv", d3.autoType).then(function (data) {
  console.log(data);

  plotBubbleChart(data);
});