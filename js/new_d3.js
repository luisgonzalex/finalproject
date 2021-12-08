// CONSTANTS
const greenSheen = "#88B7B5";
const purpleRhythm = "#847996";
const black = "#f4ecd6";

const width = 1000;
const height = 800;
const heightOffset = 60;
const offset = 100;
const center = { x: width / 2, y: height / 2 - 30 };
const padding = 2.25;

const initialRadius = 0;
const radiusLimit = 75;
const forceStrength = 0.025;

const slideThresh = 3;
const slideAll = 3;
const slideRemittances = 4;
const slideHealthPriority = 5;
const slideGovtAid = 6;
const slideBoundary = 6;

const normalOpacity = 0.9;
const deFocusOpacity = 0.2;

// BEGIN HELPER METHODS
const isOOB = (s) => {
  return !(s >= slideThresh && s <= slideBoundary);
};

const fillColor = (condition) => {
  return condition ? greenSheen : purpleRhythm;
};

const createNodes = (data) => {
  const maxVal = d3.max(data, (d) => d.exp_6months_health_USD);

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
    .style("opacity", normalOpacity)
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
        }</span> spent <h4>${formatter.format(d.value)} USD</h4>
         on healthcare.</span>`
      )
      .style("left", d3.event.pageX + 30 + "px")
      .style("top", d3.event.pageY + 30 + "px");

    const style = document.getElementById(d.id).style;
    style.stroke = "black";
    style.strokeWidth = 2;
  };
  var hideTooltip = function (d) {
    tooltip.style("visibility", "hidden");

    const style = document.getElementById(d.id).style;
    style.stroke = "black";
    style.strokeWidth = 0;
  };
  // END TOOLTIP CODE

  // begin example circle
  const showExampleBubble = () => {
    svg
      .append("circle")
      .attr("cx", "20%")
      .attr("cy", "90%")
      .attr("r", 10)
      .attr("class", "example-bubble")
      .style("fill", black);
    svg
      .append("text")
      .attr("x", "22%")
      .attr("y", "90.5%")
      .text(
        "Each bubble represents a household. Larger bubbles represent more health spending."
      )
      .style("color", black);
  };

  const removeExampleBubble = () => {
    svg.selectAll("#example-bubble").remove();
  };
  // end example circle

  const svg = d3
    .select("#bubble-chart")
    .append("svg")
    .attr("id", "svg")
    .attr("width", width)
    .attr("height", height)
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
    .attr("fill", black)
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
      .forceX((d) => (d[condition] ? width / 4 : (3 * width) / 4) + 50)
      .strength(forceStrength);
  };
  const forceY = d3.forceY(center.y).strength(forceStrength);

  const simulation = d3
    .forceSimulation()
    .velocityDecay(0.17)
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

  bubbles = bubbles.merge(bubblesE);

  const handleSlideChange = (slideNumber) => {
    if (vizStarted && prevSlide === slideNumber) return;
    if (!vizStarted && !isOOB(slideNumber)) {
      showExampleBubble();
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

    bubbles
      .transition()
      .ease(d3.easeBounce)
      .duration(100)
      .attr("r", function (d) {
        return d.radius;
      });

    // if the last viz slide we were on is the same, do nothing

    // change the slide to the correct place
    document
      .getElementById(`row-${slideNumber - slideThresh + 1}`)
      .appendChild(document.getElementById("bubble-chart"));

    bubbles.transition().duration(100).attr("opacity", normalOpacity);
    console.log("normal opacity set");

    // add the appropriate force
    if (slideNumber === slideAll) {
      svg.selectAll("#yes-r").remove();
      svg.selectAll("#no-r").remove();
      bubbles
        .transition()
        .duration(3000)
        .attr("fill", black)
        .attr("opacity", normalOpacity);
      simulation.force("x", forceXCombine);
      simulation.force("y", forceY);
      simulation.alpha(0.5).restart();
    } else if (slideNumber === slideRemittances) {
      bubbles
        .transition()
        .duration(3000)
        .attr("fill", (d) => {
          return fillColor(d.remittances);
        })
        .attr("opacity", normalOpacity);
      simulation.force("x", forceXSeparate("remittances"));
      simulation.force("y", forceY);
      simulation.alpha(0.8).restart();
      svg
        .append("text")
        .attr("x", width / 4)
        .attr("y", heightOffset)
        .text("Remittances")
        .attr("class", "remit-text")
        .attr("id", "yes-r");

      svg
        .append("text")
        .attr("x", (3 * width) / 4)
        .attr("y", heightOffset)
        .text("No Remittances")
        .attr("class", "remit-text")
        .attr("id", "no-r");
    } else if (slideNumber === slideHealthPriority) {
      bubbles
        .transition()
        .duration(3000)
        .attr("fill", (d) => {
          return fillColor(d.remittances);
        })
        .attr("opacity", (d) => {
          return d.healthPriority ? normalOpacity : deFocusOpacity;
        });
      simulation.force("x", forceXSeparate("remittances"));
      simulation.force("y", forceY);
    } else if (slideNumber === slideGovtAid) {
      bubbles
        .transition()
        .duration(3000)
        .attr("fill", (d) => {
          return fillColor(d.remittances);
        })
        .attr("opacity", (d) => {
          return d.aid ? normalOpacity : deFocusOpacity;
        });
      simulation.force("x", forceXSeparate("remittances"));
      simulation.force("y", forceY);
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
