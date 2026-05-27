/**
 * ARCADE.OS Game Engine
 * Professional Modular Architecture (No Memory Leaks)
 */
(() => {
    // --- 1. CORE INPUT & STATE SYSTEMS ---
    const Input = {
        keys: {},
        init() {
            window.addEventListener('keydown', (e) => {
                this.keys[e.code] = true;
                if(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                    e.preventDefault();
                }
            });
            window.addEventListener('keyup', (e) => this.keys[e.code] = false);
        },
        isDown(code) { return !!this.keys[code]; },
        reset() { this.keys = {}; }
    };

    const UI = {
        views: { menu: document.getElementById('menu-view'), game: document.getElementById('game-view') },
        elements: {
            canvas: document.getElementById('game-canvas'),
            ctx: document.getElementById('game-canvas').getContext('2d'),
            memoryBoard: document.getElementById('memory-board'),
            scoreLabel: document.getElementById('score-label'),
            scoreValue: document.getElementById('score-value'),
            instructions: document.getElementById('control-instructions'),
            modalOverlay: document.getElementById('modal-overlay'),
            modalScore: document.getElementById('modal-score-value')
        },
        showView(viewName) {
            Object.values(this.views).forEach(v => v.classList.remove('active', 'hidden'));
            Object.keys(this.views).forEach(k => {
                if (k === viewName) this.views[k].classList.add('active');
                else this.views[k].classList.add('hidden');
            });
        },
        showGameOver(score) {
            this.elements.modalScore.textContent = score;
            this.elements.modalOverlay.classList.add('active');
        },
        hideGameOver() { this.elements.modalOverlay.classList.remove('active'); },
        updateScore(score, label = "SCORE") {
            this.elements.scoreLabel.textContent = label;
            this.elements.scoreValue.textContent = score;
        },
        setupCanvas(width = 800, height = 600) {
            this.elements.canvas.width = width;
            this.elements.canvas.height = height;
            this.elements.canvas.classList.remove('hidden');
            this.elements.memoryBoard.classList.add('hidden');
        }
    };

    // --- 2. THE GAMES ARCHITECTURE ---
    const Games = {
        
        snake: {
            grid: 20,
            init() { UI.setupCanvas(600, 600); UI.elements.instructions.textContent = "Controls: WASD or Arrow Keys"; this.reset(); },
            reset() {
                this.snake = [{x: 15, y: 15}];
                this.dir = {x: 1, y: 0}; this.nextDir = {x: 1, y: 0};
                this.score = 0; this.frameCount = 0;
                this.spawnFood();
                UI.updateScore(this.score);
            },
            spawnFood() { this.food = { x: Math.floor(Math.random() * 30), y: Math.floor(Math.random() * 30) }; },
            update() {
                if ((Input.isDown('ArrowUp') || Input.isDown('KeyW')) && this.dir.y === 0) this.nextDir = {x: 0, y: -1};
                if ((Input.isDown('ArrowDown') || Input.isDown('KeyS')) && this.dir.y === 0) this.nextDir = {x: 0, y: 1};
                if ((Input.isDown('ArrowLeft') || Input.isDown('KeyA')) && this.dir.x === 0) this.nextDir = {x: -1, y: 0};
                if ((Input.isDown('ArrowRight') || Input.isDown('KeyD')) && this.dir.x === 0) this.nextDir = {x: 1, y: 0};

                if (++this.frameCount < 6) return; // Controls speed
                this.frameCount = 0; this.dir = this.nextDir;
                let head = { x: this.snake[0].x + this.dir.x, y: this.snake[0].y + this.dir.y };

                // Game Over Check
                if (head.x < 0 || head.x >= 30 || head.y < 0 || head.y >= 30) return App.gameOver(this.score);
                if (this.snake.some(s => s.x === head.x && s.y === head.y)) return App.gameOver(this.score);

                this.snake.unshift(head);
                if (head.x === this.food.x && head.y === this.food.y) {
                    this.score += 10; UI.updateScore(this.score); this.spawnFood();
                } else { this.snake.pop(); }
            },
            draw(ctx) {
                ctx.fillStyle = '#09090b'; ctx.fillRect(0, 0, 600, 600);
                ctx.fillStyle = '#22c55e'; // Food green
                ctx.fillRect(this.food.x * this.grid, this.food.y * this.grid, this.grid - 1, this.grid - 1);
                
                this.snake.forEach((segment, i) => {
                    ctx.fillStyle = i === 0 ? '#60a5fa' : '#3b82f6';
                    ctx.fillRect(segment.x * this.grid, segment.y * this.grid, this.grid - 1, this.grid - 1);
                });
            }
        },

        breakout: {
            init() { UI.setupCanvas(800, 600); UI.elements.instructions.textContent = "Controls: Left / Right Arrows"; this.reset(); },
            reset() {
                this.ball = { x: 400, y: 500, dx: 4, dy: -4, radius: 8 };
                this.paddle = { x: 350, y: 550, width: 100, height: 12, speed: 7 };
                this.bricks = []; this.score = 0;
                
                const colors = ['#ef4444', '#f97316', '#22c55e', '#0ea5e9', '#a855f7'];
                for(let r=0; r<5; r++) {
                    for(let c=0; c<10; c++) {
                        this.bricks.push({x: c*75 + 30, y: r*30 + 50, w: 65, h: 20, active: true, color: colors[r]});
                    }
                }
                UI.updateScore(this.score);
            },
            update() {
                if (Input.isDown('ArrowLeft')) this.paddle.x = Math.max(0, this.paddle.x - this.paddle.speed);
                if (Input.isDown('ArrowRight')) this.paddle.x = Math.min(800 - this.paddle.width, this.paddle.x + this.paddle.speed);

                this.ball.x += this.ball.dx; this.ball.y += this.ball.dy;

                // Wall collisions
                if (this.ball.x <= 0 || this.ball.x >= 800) this.ball.dx *= -1;
                if (this.ball.y <= 0) this.ball.dy *= -1;
                if (this.ball.y >= 600) return App.gameOver(this.score);

                // Paddle collision
                if (this.ball.y + this.ball.radius >= this.paddle.y && this.ball.x >= this.paddle.x && this.ball.x <= this.paddle.x + this.paddle.width) {
                    this.ball.dy = -Math.abs(this.ball.dy);
                    this.ball.dx = ((this.ball.x - (this.paddle.x + this.paddle.width/2)) / (this.paddle.width/2)) * 5;
                }

                // Brick collision
                let activeBricks = 0;
                this.bricks.forEach(b => {
                    if(b.active) {
                        activeBricks++;
                        if (this.ball.x > b.x && this.ball.x < b.x + b.w && this.ball.y - this.ball.radius < b.y + b.h && this.ball.y + this.ball.radius > b.y) {
                            b.active = false; this.ball.dy *= -1; this.score += 10; UI.updateScore(this.score);
                        }
                    }
                });
                if(activeBricks === 0) App.gameOver("WIN");
            },
            draw(ctx) {
                ctx.fillStyle = '#09090b'; ctx.fillRect(0,0,800,600);
                ctx.fillStyle = '#3b82f6'; ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height);
                ctx.fillStyle = '#f8fafc'; ctx.beginPath(); ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI*2); ctx.fill();
                this.bricks.forEach(b => { if(b.active) { ctx.fillStyle = b.color; ctx.fillRect(b.x, b.y, b.w, b.h); }});
            }
        },

        pong: {
            init() { UI.setupCanvas(800, 500); UI.elements.instructions.textContent = "Controls: W / S or Up / Down Arrows"; this.reset(); },
            reset() {
                this.p1 = { y: 200, score: 0 }; this.p2 = { y: 200, score: 0 };
                this.ball = { x: 400, y: 250, vx: 5, vy: 5 };
                UI.updateScore("0 - 0", "MATCH");
            },
            update() {
                if (Input.isDown('ArrowUp') || Input.isDown('KeyW')) this.p1.y = Math.max(0, this.p1.y - 7);
                if (Input.isDown('ArrowDown') || Input.isDown('KeyS')) this.p1.y = Math.min(400, this.p1.y + 7);

                // Simple AI
                let center = this.p2.y + 50;
                if (center < this.ball.y - 10) this.p2.y += 4.5;
                if (center > this.ball.y + 10) this.p2.y -= 4.5;
                this.p2.y = Math.max(0, Math.min(400, this.p2.y));

                this.ball.x += this.ball.vx; this.ball.y += this.ball.vy;
                if (this.ball.y <= 0 || this.ball.y >= 500) this.ball.vy *= -1;

                if (this.ball.x <= 40 && this.ball.y > this.p1.y && this.ball.y < this.p1.y + 100) {
                    this.ball.vx = Math.abs(this.ball.vx) * 1.05; this.ball.vy = (this.ball.y - (this.p1.y + 50)) * 0.15;
                }
                if (this.ball.x >= 760 && this.ball.y > this.p2.y && this.ball.y < this.p2.y + 100) {
                    this.ball.vx = -Math.abs(this.ball.vx) * 1.05; this.ball.vy = (this.ball.y - (this.p2.y + 50)) * 0.15;
                }

                if (this.ball.x < 0) this.scorePoint(2);
                if (this.ball.x > 800) this.scorePoint(1);
            },
            scorePoint(player) {
                if (player === 1) this.p1.score++; else this.p2.score++;
                UI.updateScore(`${this.p1.score} - ${this.p2.score}`, "MATCH");
                if (this.p1.score >= 10 || this.p2.score >= 10) App.gameOver(this.p1.score > this.p2.score ? "WIN" : "LOSS");
                else this.ball = { x: 400, y: 250, vx: (player===1?-5:5), vy: 5 };
            },
            draw(ctx) {
                ctx.fillStyle = '#09090b'; ctx.fillRect(0, 0, 800, 500);
                ctx.setLineDash([10, 15]); ctx.beginPath(); ctx.moveTo(400, 0); ctx.lineTo(400, 500);
                ctx.strokeStyle = '#27272a'; ctx.stroke(); ctx.setLineDash([]);
                ctx.fillStyle = '#0ea5e9'; ctx.fillRect(20, this.p1.y, 15, 100);
                ctx.fillStyle = '#ef4444'; ctx.fillRect(765, this.p2.y, 15, 100);
                ctx.fillStyle = '#f8fafc'; ctx.beginPath(); ctx.arc(this.ball.x, this.ball.y, 8, 0, Math.PI*2); ctx.fill();
            }
        },

        memory: {
            init() {
                UI.elements.canvas.classList.add('hidden');
                UI.elements.memoryBoard.classList.remove('hidden');
                UI.elements.instructions.textContent = "Controls: Mouse Click";
                this.reset();
            },
            reset() {
                this.moves = 0; this.matches = 0; this.flipped = []; this.locked = false;
                UI.updateScore(this.moves, "MOVES");
                const symbols = ['👾', '🤖', '👻', '💀', '👽', '🚀', '⭐', '🔥'];
                this.deck = [...symbols, ...symbols].sort(() => Math.random() - 0.5);
                this.renderBoard();
            },
            renderBoard() {
                const board = UI.elements.memoryBoard;
                board.innerHTML = '';
                this.deck.forEach((symbol, i) => {
                    const card = document.createElement('div');
                    card.className = 'memory-card'; card.dataset.id = i; card.innerHTML = '<span>?</span>';
                    card.addEventListener('click', () => this.flipCard(card, symbol));
                    board.appendChild(card);
                });
            },
            flipCard(card, symbol) {
                if (this.locked || card.classList.contains('flipped') || card.classList.contains('matched')) return;
                card.classList.add('flipped'); card.innerHTML = symbol; card.style.background = '#27272a';
                this.flipped.push({card, symbol});

                if (this.flipped.length === 2) {
                    this.moves++; UI.updateScore(this.moves, "MOVES"); this.locked = true;
                    if (this.flipped[0].symbol === this.flipped[1].symbol) {
                        this.matches++; this.flipped.forEach(f => f.card.classList.add('matched'));
                        this.flipped = []; this.locked = false;
                        if (this.matches === 8) setTimeout(() => App.gameOver(this.moves), 500);
                    } else {
                        setTimeout(() => {
                            this.flipped.forEach(f => { f.card.classList.remove('flipped'); f.card.innerHTML = '<span>?</span>'; f.card.style.background = ''; });
                            this.flipped = []; this.locked = false;
                        }, 800);
                    }
                }
            },
            update() {}, draw() {} // Handled via DOM
        },

        asteroids: {
            init() { UI.setupCanvas(800, 600); UI.elements.instructions.textContent = "Controls: Left/Right to Turn, Up to Thrust, Space to Shoot"; this.reset(); },
            reset() {
                this.ship = { x: 400, y: 300, angle: 0, vx: 0, vy: 0, radius: 10 };
                this.bullets = []; this.asteroids = []; this.score = 0;
                for(let i=0; i<5; i++) this.spawnAsteroid();
                UI.updateScore(this.score);
                Input.keys['Space'] = false; // prevent instant fire on restart
            },
            spawnAsteroid(x, y, size = 3) {
                this.asteroids.push({
                    x: x || Math.random()*800, y: y || Math.random()*600,
                    vx: (Math.random()-0.5)*2, vy: (Math.random()-0.5)*2,
                    size: size, radius: size * 10
                });
            },
            update() {
                if (Input.isDown('ArrowLeft')) this.ship.angle -= 0.1;
                if (Input.isDown('ArrowRight')) this.ship.angle += 0.1;
                if (Input.isDown('ArrowUp')) {
                    this.ship.vx += Math.cos(this.ship.angle) * 0.2;
                    this.ship.vy += Math.sin(this.ship.angle) * 0.2;
                }
                
                this.ship.x = (this.ship.x + this.ship.vx + 800) % 800;
                this.ship.y = (this.ship.y + this.ship.vy + 600) % 600;
                this.ship.vx *= 0.99; this.ship.vy *= 0.99;

                if (Input.isDown('Space') && (!this.lastShot || Date.now() - this.lastShot > 250)) {
                    this.bullets.push({x: this.ship.x, y: this.ship.y, vx: Math.cos(this.ship.angle)*8, vy: Math.sin(this.ship.angle)*8, life: 60});
                    this.lastShot = Date.now();
                }

                this.bullets.forEach(b => { b.x+=b.vx; b.y+=b.vy; b.life--; });
                this.bullets = this.bullets.filter(b => b.life > 0);

                this.asteroids.forEach((a, aIdx) => {
                    a.x = (a.x + a.vx + 800) % 800; a.y = (a.y + a.vy + 600) % 600;
                    
                    let dx = this.ship.x - a.x, dy = this.ship.y - a.y;
                    if (Math.sqrt(dx*dx + dy*dy) < a.radius + this.ship.radius) return App.gameOver(this.score);

                    this.bullets.forEach((b, bIdx) => {
                        let bdx = b.x - a.x, bdy = b.y - a.y;
                        if (Math.sqrt(bdx*bdx + bdy*bdy) < a.radius) {
                            this.bullets.splice(bIdx, 1); this.asteroids.splice(aIdx, 1);
                            this.score += a.size * 100; UI.updateScore(this.score);
                            if (a.size > 1) { this.spawnAsteroid(a.x, a.y, a.size-1); this.spawnAsteroid(a.x, a.y, a.size-1); }
                            if (this.asteroids.length === 0) { for(let i=0; i<5; i++) this.spawnAsteroid(); }
                        }
                    });
                });
            },
            draw(ctx) {
                ctx.fillStyle = '#09090b'; ctx.fillRect(0,0,800,600);
                
                // Draw Ship
                ctx.save(); ctx.translate(this.ship.x, this.ship.y); ctx.rotate(this.ship.angle);
                ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(15, 0); ctx.lineTo(-10, -10); ctx.lineTo(-10, 10); ctx.closePath(); ctx.stroke();
                ctx.restore();

                // Draw Bullets
                ctx.fillStyle = '#f8fafc';
                this.bullets.forEach(b => { ctx.beginPath(); ctx.arc(b.x, b.y, 2, 0, Math.PI*2); ctx.fill(); });

                // Draw Asteroids
                ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2;
                this.asteroids.forEach(a => { ctx.beginPath(); ctx.arc(a.x, a.y, a.radius, 0, Math.PI*2); ctx.stroke(); });
            }
        },

        runner: {
            init() { UI.setupCanvas(800, 400); UI.elements.instructions.textContent = "Controls: Space or Up Arrow to Jump"; this.reset(); },
            reset() {
                this.player = { y: 350, vy: 0, w: 30, h: 30, isJumping: false };
                this.obstacles = []; this.score = 0; this.frame = 0; this.speed = 6;
                UI.updateScore(this.score);
            },
            update() {
                this.frame++;
                if (this.frame % 5 === 0) { this.score++; UI.updateScore(this.score); }
                if (this.frame % 500 === 0) this.speed += 0.5;

                // Jump logic
                if ((Input.isDown('Space') || Input.isDown('ArrowUp')) && !this.player.isJumping) {
                    this.player.vy = -15; this.player.isJumping = true;
                }
                
                // Gravity
                this.player.vy += 0.8;
                this.player.y += this.player.vy;
                if (this.player.y >= 350) { this.player.y = 350; this.player.vy = 0; this.player.isJumping = false; }

                // Obstacles
                if (Math.random() < 0.02 && (this.obstacles.length === 0 || this.obstacles[this.obstacles.length-1].x < 500)) {
                    this.obstacles.push({ x: 800, y: 340, w: 20, h: 40 });
                }

                this.obstacles.forEach(obs => obs.x -= this.speed);
                this.obstacles = this.obstacles.filter(obs => obs.x > -50);

                // Collision
                this.obstacles.forEach(obs => {
                    if (50 < obs.x + obs.w && 50 + this.player.w > obs.x && this.player.y < obs.y + obs.h && this.player.y + this.player.h > obs.y) {
                        App.gameOver(this.score);
                    }
                });
            },
            draw(ctx) {
                ctx.fillStyle = '#09090b'; ctx.fillRect(0,0,800,400);
                
                // Floor
                ctx.fillStyle = '#27272a'; ctx.fillRect(0, 380, 800, 20);
                
                // Player
                ctx.fillStyle = '#3b82f6'; ctx.fillRect(50, this.player.y, this.player.w, this.player.h);
                
                // Obstacles
                ctx.fillStyle = '#eab308';
                this.obstacles.forEach(obs => ctx.fillRect(obs.x, obs.y, obs.w, obs.h));
            }
        }
    };

    // --- 3. APP CONTROLLER ---
    const App = {
        activeGame: null,
        loopId: null,
        isRunning: false,

        init() {
            lucide.createIcons(); // Initialize Icons
            Input.init();
            
            document.querySelectorAll('.game-card').forEach(card => {
                card.addEventListener('click', () => {
                    const gameId = card.dataset.game;
                    this.loadGame(gameId);
                });
            });

            document.getElementById('btn-back').addEventListener('click', () => this.returnToMenu());
            document.getElementById('btn-menu').addEventListener('click', () => this.returnToMenu());
            document.getElementById('btn-start').addEventListener('click', () => this.startGame());
            document.getElementById('btn-restart').addEventListener('click', () => {
                UI.hideGameOver();
                this.startGame();
            });
        },

        loadGame(gameId) {
            this.activeGame = Games[gameId];
            if (this.activeGame) {
                UI.showView('game');
                this.activeGame.init();
            }
        },

        startGame() {
            if (!this.activeGame) return;
            Input.reset();
            this.activeGame.reset();
            this.isRunning = true;
            
            if (this.loopId) cancelAnimationFrame(this.loopId);
            this.gameLoop();
        },

        gameLoop() {
            if (!this.isRunning) return;
            
            if (this.activeGame) {
                this.activeGame.update();
                if (!UI.elements.canvas.classList.contains('hidden')) {
                    this.activeGame.draw(UI.elements.ctx);
                }
            }
            this.loopId = requestAnimationFrame(() => this.gameLoop());
        },

        gameOver(finalScore) {
            this.isRunning = false;
            cancelAnimationFrame(this.loopId);
            UI.showGameOver(finalScore);
        },

        returnToMenu() {
            this.isRunning = false;
            cancelAnimationFrame(this.loopId);
            this.activeGame = null;
            UI.hideGameOver();
            UI.showView('menu');
        }
    };

    // Initialize App
    window.addEventListener('DOMContentLoaded', () => App.init());
})();
