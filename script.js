const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const woodCountEl = document.getElementById('wood-count');
const stoneCountEl = document.getElementById('stone-count');

const world = {
  width: 2400,
  height: 1600,
  tile: 48,
};

const player = {
  x: world.width / 2,
  y: world.height / 2,
  radius: 18,
  speed: 250,
  color: '#56b4ff',
  wood: 0,
  stone: 0,
  facingX: 0,
  facingY: 1,
};

const keys = {};
const mineRange = 70;
let lastTime = 0;

const resources = [];
const resourceCount = 80;

for (let i = 0; i < resourceCount; i++) {
  const type = Math.random() > 0.52 ? 'tree' : 'rock';
  resources.push({
    type,
    x: 60 + Math.random() * (world.width - 120),
    y: 60 + Math.random() * (world.height - 120),
    hp: type === 'tree' ? 4 : 5,
    maxHp: type === 'tree' ? 4 : 5,
    size: type === 'tree' ? 24 + Math.random() * 10 : 20 + Math.random() * 12,
  });
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function updateHUD() {
  woodCountEl.textContent = player.wood;
  stoneCountEl.textContent = player.stone;
}

function mineNearest() {
  let nearest = null;
  let bestDist = Infinity;

  for (const resource of resources) {
    const dx = resource.x - player.x;
    const dy = resource.y - player.y;
    const dist = Math.hypot(dx, dy);

    if (dist < bestDist && dist <= mineRange + resource.size) {
      bestDist = dist;
      nearest = resource;
    }
  }

  if (!nearest) {
    return;
  }

  nearest.hp -= 1;

  if (nearest.hp <= 0) {
    if (nearest.type === 'tree') {
      player.wood += 12;
    } else {
      player.stone += 10;
    }

    const idx = resources.indexOf(nearest);
    if (idx !== -1) {
      resources.splice(idx, 1);
    }

    setTimeout(() => {
      const type = Math.random() > 0.52 ? 'tree' : 'rock';
      resources.push({
        type,
        x: 60 + Math.random() * (world.width - 120),
        y: 60 + Math.random() * (world.height - 120),
        hp: type === 'tree' ? 4 : 5,
        maxHp: type === 'tree' ? 4 : 5,
        size: type === 'tree' ? 24 + Math.random() * 10 : 20 + Math.random() * 12,
      });
    }, 1800);

    updateHUD();
  }
}

function update(dt) {
  let moveX = 0;
  let moveY = 0;

  if (keys.KeyW || keys.ArrowUp) moveY -= 1;
  if (keys.KeyS || keys.ArrowDown) moveY += 1;
  if (keys.KeyA || keys.ArrowLeft) moveX -= 1;
  if (keys.KeyD || keys.ArrowRight) moveX += 1;

  if (moveX !== 0 || moveY !== 0) {
    const len = Math.hypot(moveX, moveY);
    moveX /= len;
    moveY /= len;
    player.facingX = moveX;
    player.facingY = moveY;

    player.x += moveX * player.speed * dt;
    player.y += moveY * player.speed * dt;
  }

  player.x = clamp(player.x, player.radius, world.width - player.radius);
  player.y = clamp(player.y, player.radius, world.height - player.radius);
}

function drawGrid(cameraX, cameraY) {
  ctx.fillStyle = '#7fcf57';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
  ctx.lineWidth = 1;

  const startCol = Math.floor(cameraX / world.tile);
  const endCol = Math.floor((cameraX + canvas.width) / world.tile) + 1;
  const startRow = Math.floor(cameraY / world.tile);
  const endRow = Math.floor((cameraY + canvas.height) / world.tile) + 1;

  for (let c = startCol; c <= endCol; c++) {
    const x = c * world.tile - cameraX;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  for (let r = startRow; r <= endRow; r++) {
    const y = r * world.tile - cameraY;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

function drawResources(cameraX, cameraY) {
  for (const resource of resources) {
    const x = resource.x - cameraX;
    const y = resource.y - cameraY;

    if (x < -80 || x > canvas.width + 80 || y < -80 || y > canvas.height + 80) {
      continue;
    }

    if (resource.type === 'tree') {
      ctx.fillStyle = '#5c3d1f';
      ctx.fillRect(x - 7, y, 14, 20);
      ctx.beginPath();
      ctx.arc(x, y - 8, resource.size, 0, Math.PI * 2);
      ctx.fillStyle = '#2f8f2f';
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.ellipse(x, y, resource.size, resource.size * 0.75, 0.2, 0, Math.PI * 2);
      ctx.fillStyle = '#7f8795';
      ctx.fill();
      ctx.strokeStyle = '#646d7c';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    const hpPct = resource.hp / resource.maxHp;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(x - 22, y - resource.size - 14, 44, 6);
    ctx.fillStyle = '#2de27d';
    ctx.fillRect(x - 22, y - resource.size - 14, 44 * hpPct, 6);
  }
}

function drawPlayer(cameraX, cameraY) {
  const px = player.x - cameraX;
  const py = player.y - cameraY;

  ctx.beginPath();
  ctx.arc(px, py, player.radius, 0, Math.PI * 2);
  ctx.fillStyle = player.color;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(px + player.facingX * 28, py + player.facingY * 28);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(px, py, mineRange, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawWorldBounds(cameraX, cameraY) {
  const x = -cameraX;
  const y = -cameraY;

  ctx.strokeStyle = 'rgba(20, 38, 20, 0.45)';
  ctx.lineWidth = 5;
  ctx.strokeRect(x, y, world.width, world.height);
}

function frame(ts) {
  if (!lastTime) {
    lastTime = ts;
  }

  const dt = Math.min(0.033, (ts - lastTime) / 1000);
  lastTime = ts;

  update(dt);

  const cameraX = clamp(player.x - canvas.width / 2, 0, world.width - canvas.width);
  const cameraY = clamp(player.y - canvas.height / 2, 0, world.height - canvas.height);

  drawGrid(cameraX, cameraY);
  drawWorldBounds(cameraX, cameraY);
  drawResources(cameraX, cameraY);
  drawPlayer(cameraX, cameraY);

  requestAnimationFrame(frame);
}

window.addEventListener('keydown', (event) => {
  keys[event.code] = true;

  if (event.code === 'KeyE') {
    mineNearest();
  }
});

window.addEventListener('keyup', (event) => {
  keys[event.code] = false;
});

updateHUD();
requestAnimationFrame(frame);
