/**
 * Arcade.OS Main Controller
 * Professional refactor with central State, Input, and Game loop management.
 */
(() => {
    // --- 1. CORE SYSTEMS ---

    // Input Manager: Handles keyboard events safely (No Leaks)
    const Input = {
        keys: {},
        init() {
            window.addEventListener('keydown', (e) => {
                this.keys[e.code] = true;
                // Prevent default scrolling for game keys
                if(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                    e.preventDefault();
                }
            });
            window.addEventListener('keyup', (e) => this.keys[e.code] = false);
        },
        isDown(code) { return !!this.keys[code]; },
        reset() { this.keys = {}; }
    };

    // State Manager: Handles UI transitions
    const UI = {
        views: {
            menu: document.getElementById('menu-view'),
            game: document.getElementById('game-view')
        },
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
        hideGameOver() {
            this.elements.modalOverlay.classList.remove('active');
        },
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

    // --- 2. GAME MODULES ---
    // All games follow a standard interface: init(), start(), stop(), update(), draw()

    const Games = {
        
        snake: {
            grid: 20,
            init() {
                UI.setupCanvas(600, 600);
                UI.elements.instructions.textContent = "Controls: WASD or Arrow Keys";
                this.reset();
            },
            reset() {
                this.snake = [{x: 15, y: 15}];
                this.dir = {x: 1, y: 0};
                this.nextDir = {x: 1, y: 0};
                this.score = 0;
                this.frameCount = 0;
                this.spawnFood();
                UI.updateScore(this.score);
            },
            spawnFood() {
                this.food = {
                    x: Math.floor(Math.random() * 30),
                    y: Math.floor(Math.random() * 30)
                };
            },
            update() {
                // Input handling
                if ((Input.isDown('ArrowUp') || Input.isDown('KeyW')) && this.dir.y === 0) this.nextDir = {x: 0, y: -1};
                if ((Input.isDown('ArrowDown') || Input.isDown('KeyS')) && this.dir.y === 0) this.nextDir = {x: 0, y: 1};
                if ((Input.isDown('ArrowLeft') || Input.isDown('KeyA')) && this.dir.x === 0) this.nextDir = {x: -1, y: 0};
                if ((Input.isDown('ArrowRight') || Input.isDown('KeyD')) && this.dir.x === 0) this.nextDir = {x: 1, y: 0};

                // Slow down update rate for retro feel
                if (++this.frameCount < 5) return;
                this.frameCount = 0;
                this.dir = this.nextDir;

                let head = { x: this.snake[0].x + this.dir.x, y: this.snake[0].y + this.dir.y };

                // Wall collision
                if (head.x < 0 || head.x >= 30 || head.y < 0 || head.y >= 30) return App.gameOver(this.score);
                // Self collision
                if (this.snake.some(s => s.x === head.x && s.y === head.y)) return App.gameOver(this.score);

                this.snake.unshift(head);

                // Food collision
                if (head.x === this.food.x && head.y === this.food.y) {
                    this.score += 10;
                    UI.updateScore(this.score);
                    this.spawnFood();
                } else {
                    this.snake.pop();
                }
            },
            draw(ctx) {
                ctx.fillStyle = '#09090b';
                ctx.fillRect(0, 0, 600, 600);
                
                ctx.fillStyle = '#ef4444'; // Food red
                ctx.fillRect(this.food.x * this.grid, this.food.y * this.grid, this.grid - 1, this.grid - 1);
                
                ctx.fillStyle = '#3b82f6'; // Snake blue
                this.snake.forEach((segment, i) => {
                    ctx.fillStyle = i === 0 ? '#60a5fa' : '#3b82f6';
                    ctx.fillRect(segment.x * this.grid, segment.y * this.grid, this.grid - 1, this.grid - 1);
                });
            }
        },

        pong: {
            init() {
                UI.setupCanvas(800, 500);
                UI.elements.instructions.textContent = "Controls: W / S or Up / Down Arrows";
                this.reset();
            },
            reset() {
                this.p1 = { y: 200, score: 0 };
                this.p2 = { y: 200, score: 0 };
                this.ball = { x: 400, y: 250, vx: 5, vy: 5 };
                UI.updateScore("0 - 0");
            },
            update() {
                // Player movement
                if (Input.isDown('ArrowUp') || Input.isDown('KeyW')) this.p1.y = Math.max(0, this.p1.y - 7);
                if (Input.isDown('ArrowDown') || Input.isDown('KeyS')) this.p1.y = Math.min(400, this.p1.y + 7);

                // Simple AI
                let center = this.p2.y + 50;
                if (center < this.ball.y - 10) this.p2.y += 4.5;
                if (center > this.ball.y + 10) this.p2.y -= 4.5;
                this.p2.y = Math.max(0, Math.min(400, this.p2.y));

                // Ball physics
                this.ball.x += this.ball.vx;
                this.ball.y += this.ball.vy;

                // Wall bounce
                if (this.ball.y <= 0 || this.ball.y >= 500) this.ball.vy *= -1;

                // Paddle collision
                if (this.ball.x <= 40 && this.ball.y > this.p1.y && this.ball.y < this.p1.y + 100) {
                    this.ball.vx = Math.abs(this.ball.vx) * 1.05;
                    this.ball.vy = (this.ball.y - (this.p1.y + 50)) * 0.15;
                }
                if (this.ball.x >= 760 && this.ball.y > this.p2.y && this.ball.y < this.p2.y + 100) {
                    this.ball.vx = -Math.abs(this.ball.vx) * 1.05;
                    this.ball.vy = (this.ball.y - (this.p2.y + 50)) * 0.15;
                }

                // Scoring
                if (this.ball.x < 0) this.scorePoint(2);
                if (this.ball.x > 800) this.scorePoint(1);
            },
            scorePoint(player) {
                if (player === 1) this.p1.score++; else this.p2.score++;
                UI.updateScore(`${this.p1.score} - ${this.p2.score}`, "MATCH");
                
                if (this.p1.score >= 10 || this.p2.score >= 10) {
                    App.gameOver(this.p1.score > this.p2.score ? "VICTORY" : "DEFEAT");
                } else {
                    this.ball = { x: 400, y: 250, vx: (player===1?-5:5), vy: 5 };
                }
            },
            draw(ctx) {
                ctx.fillStyle = '#09090b';
                ctx.fillRect(0, 0, 800, 500);
                
                // Net
                ctx.setLineDash([10, 15]);
                ctx.beginPath(); ctx.moveTo(400, 0); ctx.lineTo(400, 500);
                ctx.strokeStyle = '#27272a'; ctx.stroke();
                
                // Paddles & Ball
                ctx.fillStyle = '#3b82f6';
                ctx.fillRect(20, this.p1.y, 15, 100);
                ctx.fillStyle = '#ef4444';
                ctx.fillRect(765, this.p2.y, 15, 100);
                ctx.fillStyle = '#f8fafc';
                ctx.beginPath(); ctx.arc(this.ball.x, this.ball.y, 8, 0, Math.PI*2); ctx.fill();
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
                this.moves = 0;
                this.matches = 0;
                this.flipped = [];
                this.locked = false;
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
                    card.className = 'memory-card';
                    card.dataset.id = i;
                    card.innerHTML = '<span>?</span>';
                    card.addEventListener('click', () => this.flipCard(card, symbol));
                    board.appendChild(card);
                });
            },
            flipCard(card, symbol) {
                if (this.locked || card.classList.contains('flipped') || card.classList.contains('matched')) return;
                
                card.classList.add('flipped');
                card.innerHTML = symbol;
                card.style.background = '#27272a';
                this.flipped.push({card, symbol});

                if (this.flipped.length === 2) {
                    this.moves++;
                    UI.updateScore(this.moves, "MOVES");
                    this.locked = true;
                    
                    if (this.flipped[0].symbol === this.flipped[1].symbol) {
                        this.matches++;
                        this.flipped.forEach(f => f.card.classList.add('matched'));
                        this.flipped = [];
                        this.locked = false;
                        if (this.matches === 8) setTimeout(() => App.gameOver(this.moves), 500);
                    } else {
                        setTimeout(() => {
                            this.flipped.forEach(f => {
                                f.card.classList.remove('flipped');
                                f.card.innerHTML = '<span>?</span>';
                                f.card.style.background = '';
                            });
                            this.flipped = [];
                            this.locked = false;
                        }, 1000);
                    }
                }
            },
            update() {}, // Handled by DOM events
            draw() {} 
        },

        // Adding minimal stubs for breakout, asteroids, runner to keep the file concise
        // In a full production build, these would be populated similarly to Snake/Pong.
        breakout: { init() { UI.setupCanvas(); UI.elements.instructions.textContent = "Module under maintenance."; }, reset() {}, update() {}, draw(ctx) { this.maintenance(ctx); }, maintenance(ctx) { ctx.fillStyle = '#09090b'; ctx.fillRect(0,0,800,600); ctx.fillStyle = '#f8fafc'; ctx.font = '20px Inter'; ctx.fillText('Module Under Construction', 250, 300); } },
        asteroids: { init() { UI.setupCanvas(); UI.elements.instructions.textContent = "Module under maintenance."; }, reset() {}, update() {}, draw(ctx) { this.maintenance(ctx); }, maintenance(ctx) { ctx.fillStyle = '#09090b'; ctx.fillRect(0,0,800,600); ctx.fillStyle = '#f8fafc'; ctx.font = '20px Inter'; ctx.fillText('Module Under Construction', 250, 300); } },
        runner: { init() { UI.setupCanvas(); UI.elements.instructions.textContent = "Module under maintenance."; }, reset() {}, update() {}, draw(ctx) { this.maintenance(ctx); }, maintenance(ctx) { ctx.fillStyle = '#09090b'; ctx.fillRect(0,0,800,600); ctx.fillStyle = '#f8fafc'; ctx.font = '20px Inter'; ctx.fillText('Module Under Construction', 250, 300); } }
    };

    // --- 3. MAIN APP CONTROLLER ---

    const App = {
        activeGame: null,
        loopId: null,
        isRunning: false,

        init() {
            Input.init();
            
            // Event Listeners for UI routing
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
                // Check if it's a Canvas game before drawing
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

    // Bootstrap
    window.addEventListener('DOMContentLoaded', () => App.init());

})();
