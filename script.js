const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let playerX = 280;
let playerY = 360;
let bulletY = playerY;
let bulletActive = false;

document.addEventListener("keydown", movePlayer);

function movePlayer(e) {

if (e.key === "ArrowLeft") {
playerX -= 20;
}

if (e.key === "ArrowRight") {
playerX += 20;
}

if (e.key === " ") {
bulletActive = true;
bulletY = playerY;
}

}

function drawPlayer() {
ctx.fillStyle = "white";
ctx.fillRect(playerX, playerY, 40, 20);
}

function drawBullet() {

if (bulletActive) {

ctx.fillStyle = "red";
ctx.fillRect(playerX + 18, bulletY, 5, 10);

bulletY -= 10;

if (bulletY < 0) {
bulletActive = false;
}

}

}

function gameLoop() {

ctx.clearRect(0, 0, canvas.width, canvas.height);

drawPlayer();
drawBullet();

requestAnimationFrame(gameLoop);

}

gameLoop();