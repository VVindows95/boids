// Size of canvas. These get updated to fill the whole browser.
var width = 800;
let height = 400;

// TODO: Display key parameters on the html numboids visual range
visualRange = 75; // i.e.visual ragnge
centeringFactor = 0.005; // adjust velocity by this %   i.e. coherence from function flyTowardsCenter(bot)
avoidFactor = 0.05; // Adjust velocity by this %        i.e. separation from function avoidOthers()
matchingFactor = 0.05; // Adjust by this %              i.e. aligment from matchVelocity()
// Key parameter ends

numBoids = 1;
margin = 200; // from keepWithinBounds(boid)
turnFactor = 1; // from keepWithinBounds(boid)
speedLimit = 15; // from limitSpeed()
minDistance = 20; // The distance to stay away from other boids from avoidOthers()

var boids = [];

// Called initially and whenever the window resizes to update the canvas
// size and width/height variables.
// I delete the original code which call this becase this will make it full screen
function sizeCanvas() {
  const canvas = document.getElementById("boids");
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
}

// Initialization step. FUTURE TODO: make sure that the old bots are cleared as well
function initBoids() {
  console.log("Initializing", numBoids);
  boids = [];
  for (var i = 0; i < numBoids; i += 1) {
    boids[i] = {
      x: Math.random() * width,
      y: Math.random() * height,
      dx: Math.random() * 10 - 5,
      dy: Math.random() * 10 - 5,
      history: [],
    };
  }
}

// Measuring distance from bot to bot 
function distance(boid1, boid2) {
  return Math.sqrt(
    (boid1.x - boid2.x) * (boid1.x - boid2.x) +
      (boid1.y - boid2.y) * (boid1.y - boid2.y),
  );
}

// Finding closest bots 
function nClosestBoids(boid, n) {
  // Make a copy
  const sorted = boids.slice();
  // Sort the copy by distance from `boid`
  sorted.sort((a, b) => distance(boid, a) - distance(boid, b));
  // Return the `n` closest
  return sorted.slice(1, n + 1);
}

////////////////////////////////////////////////////////////////////////////////
// RULES
////////////////////////////////////////////////////////////////////////////////

// Rule 1: Find the center of mass of the other boids and adjust velocity slightly to
// point towards the center of mass.
function flyTowardsCenter(boid) {

  let centerX = 0;
  let centerY = 0;
  let numNeighbors = 0;

  for (let otherBoid of boids) {
    if (distance(boid, otherBoid) < visualRange) {
      centerX += otherBoid.x;
      centerY += otherBoid.y;
      numNeighbors += 1;
    }
  }

  if (numNeighbors) {
    centerX = centerX / numNeighbors;
    centerY = centerY / numNeighbors;

    boid.dx += (centerX - boid.x) * centeringFactor;
    boid.dy += (centerY - boid.y) * centeringFactor;
  }
}

// Rule 2: Move away from other boids that are too close to avoid colliding
function avoidOthers(boid) {
  let moveX = 0;
  let moveY = 0;
  for (let otherBoid of boids) {
    if (otherBoid !== boid) {
      if (distance(boid, otherBoid) < minDistance) {
        moveX += boid.x - otherBoid.x;
        moveY += boid.y - otherBoid.y;
      }
    }
  }

  boid.dx += moveX * avoidFactor;
  boid.dy += moveY * avoidFactor;
}

// Rule 3: Find the average velocity (speed and direction) of the other boids and
// adjust velocity slightly to match.
function matchVelocity(boid) {
  let avgDX = 0;
  let avgDY = 0;
  let numNeighbors = 0;

  for (let otherBoid of boids) {
    if (distance(boid, otherBoid) < visualRange) {
      avgDX += otherBoid.dx;
      avgDY += otherBoid.dy;
      numNeighbors += 1;
    }
  }

  if (numNeighbors) {
    avgDX = avgDX / numNeighbors;
    avgDY = avgDY / numNeighbors;

    boid.dx += (avgDX - boid.dx) * matchingFactor;
    boid.dy += (avgDY - boid.dy) * matchingFactor;
  }
}

// Rule 4* Constrain a boid to within the window. If it gets too close to an edge,
// nudge it back in and reverse its direction.
function keepWithinBounds(boid) {

  if (boid.x < margin) {
    boid.dx += turnFactor;
  }
  if (boid.x > width - margin) {
    boid.dx -= turnFactor
  }
  if (boid.y < margin) {
    boid.dy += turnFactor;
  }
  if (boid.y > height - margin) {
    boid.dy -= turnFactor;
  }
}

// Rule 5* Speed will naturally vary in flocking behavior, but real animals can't go
// arbitrarily fast.
function limitSpeed(boid) {

  const speed = Math.sqrt(boid.dx * boid.dx + boid.dy * boid.dy);
  if (speed > speedLimit) {
    boid.dx = (boid.dx / speed) * speedLimit;
    boid.dy = (boid.dy / speed) * speedLimit;
  }
}

////////////////////////////////////////////////////////////////////////////////
// End of Rules
////////////////////////////////////////////////////////////////////////////////
const DRAW_TRAIL = false;

// Drawing to canvas
function drawBoid(ctx, boid) {
  const angle = Math.atan2(boid.dy, boid.dx);
  ctx.translate(boid.x, boid.y);
  ctx.rotate(angle);
  ctx.translate(-boid.x, -boid.y);
  ctx.fillStyle = "#558cf4";
  ctx.beginPath();
  ctx.moveTo(boid.x, boid.y);
  ctx.lineTo(boid.x - 15, boid.y + 5);
  ctx.lineTo(boid.x - 15, boid.y - 5);
  ctx.lineTo(boid.x, boid.y);
  ctx.fill();
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  if (DRAW_TRAIL) {
    ctx.strokeStyle = "#558cf466";
    ctx.beginPath();
    ctx.moveTo(boid.history[0][0], boid.history[0][1]);
    for (const point of boid.history) {
      ctx.lineTo(point[0], point[1]);
    }
    ctx.stroke();
  }
}

// **Main animation loop
function animationLoop() {
  // Update each boid
  for (let boid of boids) {
    // Update the velocities according to each rule
    flyTowardsCenter(boid);
    avoidOthers(boid);
    matchVelocity(boid);
    limitSpeed(boid);
    keepWithinBounds(boid);

    // Update the position based on the current velocity
    boid.x += boid.dx;
    boid.y += boid.dy;
    boid.history.push([boid.x, boid.y])
    boid.history = boid.history.slice(-50);
  }

  // Clear the canvas and redraw all the boids in their current positions
  const ctx = document.getElementById("boids").getContext("2d");
  ctx.clearRect(0, 0, width, height);
  for (let boid of boids) {
    drawBoid(ctx, boid);
  }

  // Schedule the next frame
  window.requestAnimationFrame(animationLoop);
}

// **Once the window is loaded, this main function is called
window.onload = () => {
  // Make sure the canvas always fills the whole window
  // window.addEventListener("resize", sizeCanvas, false);
  // sizeCanvas();

  // Randomly distribute the boids to start
  initBoids();

  // Schedule the main animation loop
  window.requestAnimationFrame(animationLoop);
};

// Intearaction with the html

// old style
document.getElementById("reset").onclick = function(){
  console.log("reset Clicked");
  initBoids();
}

// for slider
document.getElementById("slider1").oninput = function() {
  document.getElementById("demo1").innerHTML = this.value+"%";
  avoidFactor = this.value / 100;
  console.log("Avoidance Factor changed to ", avoidFactor);
}

document.getElementById("slider2").oninput = function() {
  document.getElementById("demo2").innerHTML = this.value;
  numBoids = this.value;
  initBoids();
  console.log("# of boids changed to  ", numBoids);
}

document.getElementById("slider3").oninput = function() {
  document.getElementById("demo3").innerHTML = this.value;
  visualRange = this.value;
  initBoids();
  console.log("Visual Range changed to  ", visualRange);
}

document.getElementById("slider4").oninput = function() {
  document.getElementById("demo4").innerHTML = this.value;
  centeringFactor = this.value / 1000;
  initBoids();
  console.log("Centering Factor changed to  ", centeringFactor);
}

document.getElementById("slider5").oninput = function() {
  document.getElementById("demo5").innerHTML = this.value;
  matchingFactor = this.value / 100;
  initBoids();
  console.log("Speed Matching Factor changed to  ", matchingFactor);
}



document.getElementById("slider6").oninput = function() {
  document.getElementById("demo6").innerHTML = this.value;
  document.getElementById("boids").innerWidth = this.value;
  width = this.value;
  //const ctx = document.getElementById("boids").getContext("2d");
  ctx.clearRect(0, 0, width, height);
  initBoids();
  console.log("Window width changed to  ", width);
}