const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");
const levelEl = document.getElementById("level");
const messageEl = document.getElementById("message");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");

let gameRunning = false;
let animationId = null;

const player = {
  width: 60,
  height: 20,
  x: canvas.width / 2 - 30,
  y: canvas.height - 50,
  speed: 6,
  color: "#00ffcc"
};

let bullets = [];
let enemyBullets = [];
let enemies = [];
let score = 0;
let lives = 3;
let level = 1;

let rightPressed = false;
let leftPressed = false;
let spacePressed = false;
let shootCooldown = 0;

function createEnemies() {
  enemies = [];
  const rows = 4;
  const cols = 8;
  const enemyWidth = 50;
  const enemyHeight = 25;
  const padding = 20;
  const offsetTop = 60;
  const offsetLeft = 70;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      enemies.push({
        x: offsetLeft + c * (enemyWidth + padding),
        y: offsetTop + r * (enemyHeight + padding),
        width: enemyWidth,
        height: enemyHeight,
        color: "#ff4d4d",
        alive: true
      });
    }
  }
}

let enemyDirection = 1;
let enemyMoveTimer = 0;
let enemyMoveInterval = 40;

function drawPlayer() {
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.width, player.height);

  ctx.beginPath();
  ctx.moveTo(player.x, player.y);
  ctx.lineTo(player.x + player.width / 2, player.y - 20);
  ctx.lineTo(player.x + player.width, player.y);
  ctx.fillStyle = "#66ffe0";
  ctx.fill();
  ctx.closePath();
}

function drawBullets() {
  ctx.fillStyle = "#ffff00";
  bullets.forEach((bullet) => {
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  });

  ctx.fillStyle = "#ff9900";
  enemyBullets.forEach((bullet) => {
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  });
}

function drawEnemies() {
  enemies.forEach((enemy) => {
    if (!enemy.alive) return;
    ctx.fillStyle = enemy.color;
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);

    ctx.fillStyle = "#fff";
    ctx.fillRect(enemy.x + 8, enemy.y + 6, 8, 8);
    ctx.fillRect(enemy.x + enemy.width - 16, enemy.y + 6, 8, 8);
  });
}

function movePlayer() {
  if (!gameRunning) return;

  if (rightPressed && player.x < canvas.width - player.width) {
    player.x += player.speed;
  }
  if (leftPressed && player.x > 0) {
    player.x -= player.speed;
  }
}

function moveBullets() {
  bullets = bullets.filter((bullet) => bullet.y > 0);
  bullets.forEach((bullet) => {
    bullet.y -= bullet.speed;
  });

  enemyBullets = enemyBullets.filter((bullet) => bullet.y < canvas.height);
  enemyBullets.forEach((bullet) => {
    bullet.y += bullet.speed;
  });
}

function moveEnemies() {
  enemyMoveTimer++;
  if (enemyMoveTimer < enemyMoveInterval) return;
  enemyMoveTimer = 0;

  let hitEdge = false;

  enemies.forEach((enemy) => {
    if (!enemy.alive) return;
    enemy.x += 10 * enemyDirection;

    if (enemy.x + enemy.width >= canvas.width || enemy.x <= 0) {
      hitEdge = true;
    }
  });

  if (hitEdge) {
    enemyDirection *= -1;
    enemies.forEach((enemy) => {
      if (enemy.alive) {
        enemy.y += 20;
      }
    });
  }
}

function enemyShoot() {
  const aliveEnemies = enemies.filter((enemy) => enemy.alive);
  if (aliveEnemies.length === 0) return;

  const shooter = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
  enemyBullets.push({
    x: shooter.x + shooter.width / 2 - 2,
    y: shooter.y + shooter.height,
    width: 4,
    height: 12,
    speed: 4 + level * 0.4
  });
}

function handleShooting() {
  if (!gameRunning) return;

  if (shootCooldown > 0) {
    shootCooldown--;
  }

  if (spacePressed && shootCooldown === 0) {
    bullets.push({
      x: player.x + player.width / 2 - 2,
      y: player.y,
      width: 4,
      height: 12,
      speed: 8
    });
    shootCooldown = 15;
  }
}

function checkCollisions() {
  bullets.forEach((bullet, bulletIndex) => {
    enemies.forEach((enemy) => {
      if (
        enemy.alive &&
        bullet.x < enemy.x + enemy.width &&
        bullet.x + bullet.width > enemy.x &&
        bullet.y < enemy.y + enemy.height &&
        bullet.y + bullet.height > enemy.y
      ) {
        enemy.alive = false;
        bullets.splice(bulletIndex, 1);
        score += 10;
        scoreEl.textContent = score;
      }
    });
  });

  enemyBullets.forEach((bullet, bulletIndex) => {
    if (
      bullet.x < player.x + player.width &&
      bullet.x + bullet.width > player.x &&
      bullet.y < player.y + player.height &&
      bullet.y + bullet.height > player.y
    ) {
      enemyBullets.splice(bulletIndex, 1);
      lives--;
      livesEl.textContent = lives;

      if (lives <= 0) {
       lives = 0;
       livesEl.textContent = lives;
       endGame("Game Over! The aliens defeated you.");
      }
    }
  });

  enemies.forEach((enemy) => {
    if (enemy.alive && enemy.y + enemy.height >= player.y) {
      endGame("Game Over! The aliens reached your ship.");
    }
  });

  const allDead = enemies.every((enemy) => !enemy.alive);
  if (allDead) {
    level++;
    levelEl.textContent = level;
    enemyMoveInterval = Math.max(10, enemyMoveInterval - 5);
    bullets = [];
    enemyBullets = [];
    createEnemies();
  }
}

function drawBackgroundStars() {
  ctx.fillStyle = "white";
  for (let i = 0; i < 60; i++) {
    const x = (i * 137) % canvas.width;
    const y = (i * 97) % canvas.height;
    ctx.fillRect(x, y, 2, 2);
  }
}

function update() {
  if (!gameRunning) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawBackgroundStars();
  movePlayer();
  handleShooting();
  moveBullets();
  moveEnemies();
  checkCollisions();

  drawPlayer();
  drawBullets();
  drawEnemies();

  animationId = requestAnimationFrame(update);
}

function startGame() {
  resetGame();
  gameRunning = true;
  messageEl.textContent = "";
  update();

  enemyFireLoop();
}

function enemyFireLoop() {
  if (!gameRunning) return;

  enemyShoot();

  const delay = Math.max(400, 1200 - level * 80);
  setTimeout(() => {
    if (gameRunning) {
      enemyFireLoop();
    }
  }, delay);
}

function endGame(message) {
  gameRunning = false;
  rightPressed = false;
  leftPressed = false;
  spacePressed = false;
  cancelAnimationFrame(animationId);
  messageEl.textContent = message;
}

function resetGame() {
  cancelAnimationFrame(animationId);
  gameRunning = false;

  player.x = canvas.width / 2 - player.width / 2;
  bullets = [];
  enemyBullets = [];
  score = 0;
  lives = 3;
  level = 1;
  enemyDirection = 1;
  enemyMoveTimer = 0;
  enemyMoveInterval = 40;

  scoreEl.textContent = score;
  livesEl.textContent = lives;
  levelEl.textContent = level;
  messageEl.textContent = "";

  createEnemies();
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Right" || e.key === "ArrowRight") {
    rightPressed = true;
  } else if (e.key === "Left" || e.key === "ArrowLeft") {
    leftPressed = true;
  } else if (e.key === " " || e.code === "Space") {
    e.preventDefault();
    spacePressed = true;
  }
});

document.addEventListener("keyup", (e) => {
  if (e.key === "Right" || e.key === "ArrowRight") {
    rightPressed = false;
  } else if (e.key === "Left" || e.key === "ArrowLeft") {
    leftPressed = false;
  } else if (e.key === " " || e.code === "Space") {
    spacePressed = false;
  }
});

startBtn.addEventListener("click", () => {
  if (!gameRunning) {
    startGame();
  }
});

restartBtn.addEventListener("click", () => {
  startGame();
});

resetGame();