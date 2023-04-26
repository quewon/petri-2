var canvas = document.querySelector("canvas");
var context = canvas.getContext("2d");
var scaleFactor = 2;
var objects = [];
var tooltip = document.getElementById("tooltip");
var mouse = { x:-1, y:-1, radius: 10 * scaleFactor, down: false, object: null, tooltip: "" };

function resize() {
  canvas.width = window.innerWidth * scaleFactor;
  canvas.height = window.innerHeight * scaleFactor;
}

function animate() {
  context.fillStyle = "rgba(240, 219, 144, .2)";
  context.fillRect(0, 0, canvas.width, canvas.height);

  update();

  for (let object of objects) { object.draw() }

  context.strokeStyle = "rgba(0, 0, 0, .1)";
  context.lineWidth = scaleFactor;
  context.beginPath();
  if (mouse.tooltip == "") {
    context.arc(mouse.x, mouse.y, mouse.down ? 0 : mouse.radius, 0, Math.PI*2);
  } else {
    context.arc(mouse.x, mouse.y, 5, 0, Math.PI*2);
  }
  context.stroke();

  requestAnimationFrame(animate);
}

function update() {
  mouse.tooltip = "";

  for (let object of objects) { object.update() }

  if (mouse.object) {
    mouse.object.colRadius += 1;
  }

  if (mouse.tooltip == "") {
    tooltip.classList.add("gone");
  } else {
    tooltip.textContent = mouse.tooltip;
    tooltip.classList.remove("gone");
  }
}

function lerp(v0, v1, t) {
  return v0*(1-t)+v1*t;
}

function smoothstep (x, edge0, edge1) {
  edge0 = edge0 || 0;
  edge1 = edge1 || 1;

  x = (x - edge0) / (edge1 - edge0);
  x = Math.max(0, x);
  x = Math.min(1, x);

  return x * x * (3 - 2*x);
}

class Object {
  constructor(x, y, attraction) {
    objects.push(this);
    this.x = x;
    this.y = y;
    this.radius = 3 * scaleFactor;
    this.colRadius = 100 * scaleFactor;

    this.vy = 0;
    this.vx = 0;

    this.attraction = attraction || 1;

    this.xo = 0;
    this.yo = 0;
    this.time = 0;
    this.jitterInterval = 5;

    this.mode = "idle";
  }

  rgb() {
    return ["rgb(200,100,100)", "rgb(100,200,100)", "rgb(100,100,200)"][Math.random() * 3 | 0];
  }

  collision(x, y, radius) {
    const xd = this.x - x;
    const yd = this.y - y;
    const sqrDistance = (xd * xd) + (yd * yd);
    const sqrRadii = (this.radius + radius) * (this.radius + radius);
    if (sqrDistance < sqrRadii) return true;
    return false;
  }

  update() {
    this.connections = [];
    for (let object of objects) {
      if (object.x == this.x && object.y == this.y) continue;
      if (this.collision(object.x, object.y, object.colRadius)) {
        // get dragged toward this object, a little bit
        const dx = this.x - object.x;
        const dy = this.y - object.y;
        const sqrDistance = (dx * dx) + (dy * dy);

        const factor = object.attraction * 100000;
        this.vx -= dx / factor;
        this.vy -= dy / factor;

        const power = sqrDistance / (object.colRadius * object.colRadius);
        const r = lerp(255, 0, power) * Math.random();
        const g = lerp(150, 255, power) * Math.random();
        const b = lerp(0, 255, power) * Math.random();

        this.connections.push({
          x1: this.x, y1: this.y,
          x2: object.x, y2: object.y,
          color: "rgba("+r+", "+g+", "+b+", .15)"
        });
      }
    }

    this.y += this.vy;
    this.x += this.vx;

    if (this.vy != 0 || this.vx != 0) {
      this.mode = "drifting";
    }

    var hit = false;
    if (this.y + this.radius > canvas.height) {
      this.y = canvas.height - this.radius;
      this.vy /= -2;
      hit = true;
    }
    if (this.y - this.radius < 0) {
      this.y = this.radius;
      this.vy /= -2;
      hit = true;
    }
    if (this.x - this.radius < 0) {
      this.x = this.radius;
      this.vx /= -2;
      hit = true;
    }
    if (this.x + this.radius > canvas.width) {
      this.x = canvas.width - this.radius;
      this.vx /= -2;
      hit = true;
    }

    if (this.connections.length > 0) {
      this.mode = "playing";
    }

    if (hit) {
      this.mode = "bouncing";
    }

    if (this.collision(mouse.x, mouse.y, mouse.radius)) {
      mouse.tooltip = this.mode;
    }
  }

  draw() {
    context.strokeStyle = "rgba(0, 0, 0, .02)";
    context.beginPath();
    context.arc(this.x, this.y, this.colRadius, 0, Math.PI*2);
    if (this.attraction > 0) {
      context.stroke();
    } else {
      context.stroke();
      context.fillStyle = "rgba(200, 70, 20, .015)";
      context.fill();
    }

    for (let line of this.connections) {
      context.strokeStyle = line.color;
      context.beginPath();
      context.moveTo(line.x1, line.y1);
      context.lineTo(line.x2, line.y2);
      context.stroke();
    }
    if (this.connections.length == 0 && this.attraction >= 0) {
      context.strokeStyle = "rgba(0, 0, 0, .15)";
    }

    this.time++;
    if (this.time > this.jitterInterval) {
      this.time = 0;
      this.xo = (Math.random() - .5) * 2;
      this.yo = (Math.random() - .5) * 2;
    }
    let x = this.x + this.xo;
    let y = this.y + this.yo;

    if (this.attraction < 0) context.strokeStyle = "rgb(255, 50, 50, .15)";
    context.beginPath();
    context.arc(x, y, this.radius, 0, Math.PI*2);
    context.stroke();
  }
}

//

window.onresize = resize;
resize();
animate();

for (let i=0; i<20; i++) {
  setTimeout(function() {
    var object = new Object(Math.random() * canvas.width, Math.random() * canvas.height, Math.random());
    object.colRadius = (10 + Math.random() * 150) * scaleFactor;
  }, Math.random() * 3000);
}

document.onmousemove = function(e) {
  mouse.x = e.pageX * scaleFactor;
  mouse.y = e.pageY * scaleFactor;
  tooltip.style.left = e.pageX+"px";
  tooltip.style.top = e.pageY+"px";
};
canvas.onmousedown = function(e) {
  if (mouse.tooltip == "") {
    mouse.down = true;
    mouse.object = new Object(e.pageX * scaleFactor, e.pageY * scaleFactor, e.button == 2 ? -1 : 1);
    mouse.object.colRadius = 10 * scaleFactor;
  } else {

  }
};
canvas.onmouseup = function() {
  mouse.down = false;
  mouse.object = null;
};

canvas.oncontextmenu = function(e) {
  e.preventDefault();
};
