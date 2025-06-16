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
let programmerTiredImage;
let programmerLilHappyImage;
let fileImage;
let coffeeImage;
let bugImage;
let wallImage;

// X = wall, O = skip, p = programmer, ' ' = file
// b = bug, c = coffee
const tileMap = [
    'XXXXXXXXXXXXXXXXXXX',
    'X   b    X    c   X',
    'X XX XXX X XXX XX X',
    'X                 X',
    'X XX X XXXXX X XX X',
    'X    X       X    X',
    'XXXX XXXX XXXX XXXX',
    'OOOX X       X XOOO',
    'XXXX X XXOXX X XXXX',
    'O        b     c  O',
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
const files = new Set();
const bugs = new Set();
const coffees = new Set();
let programmer;

const directions = ['U', 'D', 'R', 'L'];
let score = 0;
let lives = 3;
let gameOver = false;

window.onload = function() {
    board = document.getElementById('board');
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext('2d');

    loadImages();
    loadMap();
    // console.log(walls.size);
    // console.log(files.size);
    // console.log(bugs.size);
    // console.log(coffees.size);
    for (let bug of bugs.values()) {
        const newDirection = directions[Math.floor(Math.random() * 4)]; // 0-3
        bug.updateDirection(newDirection);
    }
    update();
    document.addEventListener('keyup', moveProgrammer);
};

function loadImages() {
    wallImage = new Image();
    wallImage.src = 'assets/wall.png';

    fileImage = new Image();
    fileImage.src = 'assets/file.png';
    coffeeImage = new Image();
    coffeeImage.src = 'assets/coffee.png';
    bugImage = new Image();
    bugImage.src = 'assets/bug.png';

    programmerTiredImage = new Image();
    programmerTiredImage.src = 'assets/programmer-tired.png';
    programmerLilHappyImage = new Image();
    programmerLilHappyImage.src = 'assets/programmer-lilhappy.png';
}

function loadMap() {
    walls.clear();
    files.clear();
    bugs.clear();
    coffees.clear();

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
                const bug = new Block(bugImage, x, y, tileSize, tileSize);
                bugs.add(bug);
            } else if (tileMapChar == 'p') {
                programmer = new Block(programmerTiredImage, x, y, tileSize, tileSize);
            } else if (tileMapChar == ' ') {
                const file = new Block(fileImage, x, y, tileSize, tileSize);
                files.add(file);
            } else if (tileMapChar == 'c') {
                const coffee = new Block(coffeeImage, x, y, tileSize, tileSize);
                coffees.add(coffee);
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
    context.drawImage(programmer.image, programmer.x, programmer.y, programmer.width, programmer.height);
    for (let bug of bugs.values()) {
        context.drawImage(bug.image, bug.x, bug.y, bug.width, bug.height);
    }
    for (let wall of walls.values()) {
        context.drawImage(wall.image, wall.x, wall.y, wall.width, wall.height);
    }
    for (let file of files.values()) {
        context.drawImage(file.image, file.x, file.y, file.width, file.height);
    }
    for (let coffee of coffees.values()) {
        context.drawImage(coffee.image, coffee.x, coffee.y, coffee.width, coffee.height);
    }

    // score
    context.fillStyle = 'white';
    context.font = '14px sans-serif';
    if (gameOver) {
        context.fillText('Game Over! Score: ' + String(score), tileSize/2, tileSize/2);
    }
    else {
        context.fillText('❤️' + String(lives) + ', Score: ' + String(score), tileSize/2, tileSize/2);
    }
}

function move() {
    programmer.x += programmer.velocityX;
    programmer.y += programmer.velocityY;

    // check wall collisions
    for ( let wall of walls.values()) {
        if (collision(programmer, wall)) {
            programmer.x -= programmer.velocityX;
            programmer.y -= programmer.velocityY;
            break;
        }
    }

    for (let bug of bugs.values()) {
        if (collision(bug, programmer)) {
            lives -= 1;
            if (lives == 0) {
                gameOver = true;
                return;
            }
            resetPositions();
        }

        if (bug.y == tileSize * 9 && bug.direction != 'U' && bug.direction != 'D') {
            bug.updateDirection('U');
        }

        bug.x += bug.velocityX;
        bug.y += bug.velocityY;
        for ( let wall of walls.values()) {
            if (collision(bug, wall) || bug.x <= 0 || bug.x + bug.width >= boardWidth) {
                bug.x -= bug.velocityX;
                bug.y -= bug.velocityY;
                const newDirection = directions[Math.floor(Math.random() * 4)];
                bug.updateDirection(newDirection);
            }
        }
    }

    // check file collision
    let fileEaten = null;
    for (let file of files.values()) {
        if (collision(programmer, file)) {
            fileEaten = file;
            score += 10;
            break;
        }
    }
    files.delete(fileEaten);

    // check coffee collision
    let coffeeTaken = null;
    for (let coffee of coffees.values()) {
        if (collision(programmer, coffee)) {
            coffeeTaken = coffee;
            programmer.image = programmerLilHappyImage; // expression change
            setTimeout(() => {
                programmer.image = programmerTiredImage; // back to tired expression
            }, 5000); // 5 seconds
            score += 5;
            break;
        }
    }
    coffees.delete(coffeeTaken);

    // finish the game
    if (files.size == 0) {
        loadMap();
        resetPositions();
    }
}

function moveProgrammer(e) {
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
        programmer.updateDirection('U');
    }
    else if (e.code == 'ArrowDown' || e.code == 'KeyS') {
        programmer.updateDirection('D');
    }
    else if (e.code == 'ArrowLeft' || e.code == 'KeyA') {
        programmer.updateDirection('L');
    }
    else if (e.code == 'ArrowRight' || e.code == 'KeyD') {
        programmer.updateDirection('R');
    }
}

function collision(a, b) {
    return a.x < b.x + b.width &&   // a's top left corner doesn't reach b's top right corner
           a.x + a.width > b.x &&   // a's top right corner passes b's top left corner
           a.y < b.y + b.height &&  // a's top left corner doesn't reach b's bottom left corner
           a.y + a.height > b.y;    // a's bottom left corner passes b's top left corner
}

function resetPositions() {
    programmer.reset();
    programmer.velocityX = 0;
    programmer.velocityY = 0;
    for (let bug of bugs.values()) {
        bug.reset();
        const newDirection = directions[Math.floor(Math.random() * 4 )];
        bug.updateDirection(newDirection);
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
