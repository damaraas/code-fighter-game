/* eslint-disable linebreak-style */
/* eslint-disable no-undef */
/* eslint-disable max-len */
// board
let board;
const rowCount = 21;
const columnCount = 19;
const tileSize = 32;
const boardWidth = columnCount * tileSize;
const boardHeight = rowCount * tileSize;
let context;

// images
let playerImage;
let playerHappyImage;
let itemImage;
let powerupImage;
let enemyImage;
let wallImage;

// X = wall, O = skip, p = player, ' ' = item
// b = enemy, c = power up
const tileMap = [
    'XXXXXXXXXXXXXXXXXXX',
    'X   b    X    c   X',
    'X XX XXX X XXX XX X',
    'X    c            X',
    'X XX X XXXXX X XX X',
    'X    X       X    X',
    'XXXX XXXX XXXX XXXX',
    'OOOX X   c   X XOOO',
    'XXXX X XXOXX X XXXX',
    'X        b     c  X',
    'XXXX X XXXXX X XXXX',
    'OOOX X       X XOOO',
    'XXXX X XXXXX X XXXX',
    'X        X        X',
    'X XX XXX X XXX XX X',
    'X  X     p     X  X',
    'XX X X XXXXX X X XX',
    'X    X   X   X  b X',
    'X XXXXXX X XXXXXX X',
    'X    c            X',
    'XXXXXXXXXXXXXXXXXXX',
];

const walls = new Set();
const items = new Set();
const enemies = new Set();
const powerups = new Set();
let player;
let currentTheme = 'programmer';

const directions = ['U', 'D', 'R', 'L'];
let score = 0;
let lives = 3;
let gameOver = false;

const themes = {
  programmer: {
    player: 'assets/programmer-tired.png',
    player_happy: 'assets/programmer-lilhappy.png',
    item: 'assets/file.png',
    powerup: 'assets/coffee.png',
    enemy: 'assets/bug.png',
  },
  kitty: {
    player: 'assets/kitty.png',
    player_happy: 'assets/kitty.png',
    item: 'assets/fish.png',
    powerup: 'assets/milk.png',
    enemy: 'assets/dog.png',
  },
};

window.onload = function() {
    const themeButtons = document.querySelectorAll('.theme-button');

    themeButtons.forEach((button) => {
        button.addEventListener('click', () => {
        const theme = button.innerText.toLowerCase();
        currentTheme = theme;

        let bgImage = '';

        if (theme.includes('programmer')) {
        bgImage = 'url(\'assets/bg-programmer.png\')';
        } else if (theme.includes('kitty')) {
        bgImage = 'url(\'assets/bg-kitty.png\')';
        }

        document.body.style.setProperty('--bg-image', bgImage);
        document.querySelector('.opening').style.display = 'none';
        document.getElementById('board').style.display = 'block';
        document.getElementById('back-home').style.display = 'block';

        gameOver = false;
        initGame();
        });
    });

    document.getElementById('back-home').addEventListener('click', () => {
        gameOver = true;

        document.getElementById('board').style.display = 'none';
        document.getElementById('back-home').style.display = 'none';
        document.querySelector('.opening').style.display = 'block';
        document.body.style.removeProperty('--bg-image');

        // Reset data
        score = 0;
        lives = 3;

        // Reset player
        player = null;
    });
};

function initGame() {
    document.removeEventListener('keyup', movePlayer);

    board = document.getElementById('board');
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext('2d');

    // reset player
    player = null;

    loadImages();
    loadMap();
    // console.log(walls.size);
    // console.log(items.size);
    // console.log(enemies.size);
    // console.log(powerups.size);
    for (let enemy of enemies.values()) {
        const newDirection = directions[Math.floor(Math.random() * 4)]; // 0-3
        enemy.updateDirection(newDirection);
    }
    update();
    document.addEventListener('keyup', movePlayer);
}

function loadImages() {
  const theme = themes[currentTheme];

    wallImage = new Image();
    wallImage.src = 'assets/wall.png';

    itemImage = new Image();
    itemImage.src = theme.item;
    powerupImage = new Image();
    powerupImage.src = theme.powerup;
    enemyImage = new Image();
    enemyImage.src = theme.enemy;

    playerImage = new Image();
    playerImage.src = theme.player;
    playerHappyImage = new Image();
    playerHappyImage.src = theme.player_happy;
}

function loadMap() {
    walls.clear();
    items.clear();
    enemies.clear();
    powerups.clear();

    for (let r = 0; r < rowCount; r++) {
        for (let c = 0; c < columnCount; c++) {
            const row = tileMap[r];
            const tileMapChar = row[c];

            const x = c * tileSize;
            const y = r * tileSize;

            if (tileMapChar == 'X') {
                const wall = new Block(wallImage, x, y, tileSize, tileSize);
                walls.add(wall);
            } else if (tileMapChar == 'b') {
                const enemy = new Block(enemyImage, x, y, tileSize, tileSize);
                enemies.add(enemy);
            } else if (tileMapChar == 'p') {
                player = new Block(playerImage, x, y, tileSize, tileSize);
            } else if (tileMapChar == ' ') {
                const item = new Block(itemImage, x, y, tileSize, tileSize);
                items.add(item);
            } else if (tileMapChar == 'c') {
                const powerup = new Block(powerupImage, x, y, tileSize, tileSize);
                powerups.add(powerup);
            }
        }
    }
}

function update() {
    if (gameOver) {
        return;
    }
    move();
    draw();
    setTimeout(update, 50); // 20 FPS 1 -> 1000ms/20 = 50
}

function draw() {
    context.clearRect(0, 0, board.width, board.height);
    context.drawImage(player.image, player.x, player.y, player.width, player.height);
    for (let enemy of enemies.values()) {
        context.drawImage(enemy.image, enemy.x, enemy.y, enemy.width, enemy.height);
    }
    for (let wall of walls.values()) {
        context.drawImage(wall.image, wall.x, wall.y, wall.width, wall.height);
    }
    for (let item of items.values()) {
        context.drawImage(item.image, item.x, item.y, item.width, item.height);
    }
    for (let powerup of powerups.values()) {
        context.drawImage(powerup.image, powerup.x, powerup.y, powerup.width, powerup.height);
    }

    // score
    context.fillStyle = 'black';
    context.font = '14px sans-serif';
    if (gameOver) {
        context.fillText('Game Over! Score: ' + String(score), tileSize/2, tileSize/2);
    }
    else {
        context.fillText('❤️' + String(lives) + ', Score: ' + String(score), tileSize/2, tileSize/2);
    }
}

function move() {
    player.x += player.velocityX;
    player.y += player.velocityY;

    // check wall collisions
    for ( let wall of walls.values()) {
        if (collision(player, wall)) {
            player.x -= player.velocityX;
            player.y -= player.velocityY;
            break;
        }
    }

    for (let enemy of enemies.values()) {
        if (collision(enemy, player)) {
            lives -= 1;
            if (lives == 0) {
                gameOver = true;
                return;
            }
            resetPositions();
        }

        if (enemy.y == tileSize * 9 && enemy.direction != 'U' && enemy.direction != 'D') {
            enemy.updateDirection('U');
        }

        enemy.x += enemy.velocityX;
        enemy.y += enemy.velocityY;
        for ( let wall of walls.values()) {
            if (collision(enemy, wall) || enemy.x <= 0 || enemy.x + enemy.width >= boardWidth) {
                enemy.x -= enemy.velocityX;
                enemy.y -= enemy.velocityY;
                const newDirection = directions[Math.floor(Math.random() * 4)];
                enemy.updateDirection(newDirection);
            }
        }
    }

    // check file collision
    let itemEaten = null;
    for (let item of items.values()) {
        if (collision(player, item)) {
            itemEaten = item;
            score += 10;
            break;
        }
    }
    items.delete(itemEaten);

    // check coffee collision
    let powerupTaken = null;
    for (let powerup of powerups.values()) {
        if (collision(player, powerup)) {
            powerupTaken = powerup;
            player.image = playerImage; // expression change
            setTimeout(() => {
                player.image = playerHappyImage; // back to tired expression
            }, 5000); // 5 seconds
            score += 5;
            break;
        }
    }
    powerups.delete(powerupTaken);

    // finish the game
    if (items.size == 0) {
        loadMap();
        resetPositions();
    }
}

function movePlayer(e) {
    if (gameOver) {
        loadMap();
        resetPositions();
        lives = 3;
        score = 0;
        gameOver = false;
        update();
        return;
    }
    if (e.code == 'ArrowUp' || e.code == 'KeyW') {
        player.updateDirection('U');
    }
    else if (e.code == 'ArrowDown' || e.code == 'KeyS') {
        player.updateDirection('D');
    }
    else if (e.code == 'ArrowLeft' || e.code == 'KeyA') {
        player.updateDirection('L');
    }
    else if (e.code == 'ArrowRight' || e.code == 'KeyD') {
        player.updateDirection('R');
    }
}

function collision(a, b) {
    return a.x < b.x + b.width &&   // a's top left corner doesn't reach b's top right corner
           a.x + a.width > b.x &&   // a's top right corner passes b's top left corner
           a.y < b.y + b.height &&  // a's top left corner doesn't reach b's bottom left corner
           a.y + a.height > b.y;    // a's bottom left corner passes b's top left corner
}

function resetPositions() {
    player.reset();
    player.velocityX = 0;
    player.velocityY = 0;
    for (let enemy of enemies.values()) {
        enemy.reset();
        const newDirection = directions[Math.floor(Math.random() * 4 )];
        enemy.updateDirection(newDirection);
    }
}

class Block {
    constructor(image, x, y, width, height) {
        this.image = image;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        this.startX = x;
        this.startY = y;

        this.direction = 'R';
        this.velocityX = 0;
        this.velocityY = 0;
    }

    updateDirection(direction) {
        const prevDirection = this.direction;
        this.direction = direction;
        this.updateVelocity();
        this.x += this.velocityX;
        this.y += this.velocityY;

        for (let wall of walls.values()) {
            if (collision(this, wall)) {
                this.x -= this.velocityX;
                this.y -= this.velocityY;
                this.direction = prevDirection;
                this.updateVelocity();
                return;
            }
        }
    }

    updateVelocity() {
        if (this.direction == 'U') {
            this.velocityX = 0;
            this.velocityY = -tileSize/4;
        }
        else if (this.direction == 'D') {
            this.velocityX = 0;
            this.velocityY = tileSize/4;
        }
        else if (this.direction == 'L') {
            this.velocityX = -tileSize/4;
            this.velocityY = 0;
        }
        else if (this.direction == 'R') {
            this.velocityX = tileSize/4;
            this.velocityY = 0;
        }
    }

    reset() {
        this.x = this.startX;
        this.y = this.startY;
    }
}
