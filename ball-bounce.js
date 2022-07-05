function handleClick(evt) {
  console.log(evt);
}

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const width = canvas.offsetWidth;
const height = canvas.offsetHeight;
const stop = document.getElementById('stop');
const speed = 0.01;
const radius_of_influence = 0.4;

canvas.onclick = handleClick;

// Ball has properties x, y, vx, vy randomly initialized
// Properties use percentages instead of pixel values
let balls = [];

for (let i = 0; i < 20; ++i) {
  balls.push({
    x: Math.random(),
    y: Math.random(),
    vx: Math.random() * 2 - 1,
    vy: Math.random() * 2 - 1,
  });
}

let instanceID = null;

stop.onclick = () => {
  clearInterval(instanceID);
}

function dist(a, b) {
  return Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2);
}

function step() {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = 'rgb(0, 0, 0)';
  ctx.strokeStyle = 'rgb(0, 0, 0)';
  for (let i = 0; i < balls.length; ++i) {
    const b = balls[i];

    ctx.beginPath();
    ctx.arc(b.x * width, b.y * height, 5, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.closePath();

    for (let j = i + 1; j < balls.length; ++j) {
      const other = balls[j];

      const d = dist(b, other);
      if (d <= radius_of_influence * radius_of_influence) {
        ctx.beginPath();
        ctx.moveTo(b.x * width, b.y * height);
        ctx.lineTo(other.x * width, other.y * height);
        ctx.stroke();
        ctx.closePath();
      }
    }

    b.x += b.vx * speed;
    b.y += b.vy * speed;

    if (b.x < 0) b.vx = Math.abs(b.vx);
    if (b.x > 1) b.vx = -Math.abs(b.vx);
    if (b.y < 0) b.vy = Math.abs(b.vy);
    if (b.y > 1) b.vy = -Math.abs(b.vy);
  }
}

window.addEventListener('load', () => {
  instanceID = setInterval(step, 25);
});
