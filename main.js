lucide.createIcons();

(() => {
    // --- 1. CORE INPUT SYSTEM ---
    const Input = {
        keys: {},
        init() {
            window.addEventListener('keydown', (e) => {
                this.keys[e.code] = true;
                if(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
            });
            window.addEventListener('keyup', (e) => this.keys[e.code] = false);
        },
        isDown(code) { return !!this.keys[code]; },
        reset() { this.keys = {}; }
    };

    // --- 2. GLOBAL FX & PHYSICS ENGINE ---
    const FX = {
        particles: [], texts: [], shake: 0,
        
        spawn(x, y, color, count = 10, speedMultiplier = 1) {
            for(let i=0; i<count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = (Math.random() * 3 + 1) * speedMultiplier;
                this.particles.push({
                    x, y, vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed,
                    life: 1, decay: Math.random() * 0.02 + 0.02,
                    color, size: Math.random() * 3 + 2
                });
            }
        },
        
        floatingText(x, y, text, color) {
            this.texts.push({ x, y, text, color, life: 1, vy: -1 });
        },

        addShake(amount) { this.shake = Math.min(this.shake + amount, 20); },

        update() {
            if (this.shake > 0) this.shake *= 0.9;
            if (this.shake < 0.5) this.shake = 0;

            this.particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life -= p.decay; p.size *= 0.95; });
            this.particles = this.particles.filter(p => p.life > 0);

            this.texts.forEach(t => { t.y += t.vy; t.life -= 0.02; });
            this.texts = this.texts.filter(t => t.life > 0);
        },

        draw(ctx) {
            this.particles.forEach(p => {
                ctx.globalAlpha = p.life; ctx.fillStyle = p.color;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
            });
            this.texts.forEach(t => {
                ctx.globalAlpha = t.life; ctx.fillStyle = t.color;
                ctx.font = 'bold 20px JetBrains Mono'; ctx.textAlign = 'center';
                ctx.fillText(t.text, t.x, t.y);
            });
            ctx.globalAlpha = 1;
        },

        applyShake(ctx) {
            if (this.shake > 0) {
                const dx = (Math.random() - 0.5) * this.shake;
                const dy = (Math.random() - 0.5) * this.shake;
                ctx.translate(dx, dy);
            }
        },
        
        reset() { this.particles = []; this.texts = []; this.shake = 0; }
    };

    // --- 3. UI CONTROLLER ---
    const UI = {
        views: { menu: document.getElementById('menu-view'), game: document.getElementById('game-view') },
        elements: {
            canvas: document.getElementById('game-canvas'), ctx: document.getElementById('game-canvas').getContext('2d'),
            memoryBoard: document.getElementById('memory-board'), scoreLabel: document.getElementById('score-label'),
            scoreValue: document.getElementById('score-value'), instructions: document.getElementById('control-instructions'),
            modalOverlay: document.getElementById('modal-overlay'), modalScore: document.getElementById('modal-score-value')
        },
        showView(viewName) {
            Object.values(this.views).forEach(v => v.classList.remove('active', 'hidden'));
            this.views[viewName].classList.add('active');
        },
        showGameOver(score) { this.elements.modalScore.textContent = score; this.elements.modalOverlay.classList.add('active'); },
        hideGameOver() { this.elements.modalOverlay.classList.remove('active'); },
        updateScore(score, label = "SCORE") { this.elements.scoreLabel.textContent = label; this.elements.scoreValue.textContent = score; },
        setupCanvas(width = 800, height = 600) {
            this.elements.canvas.width = width; this.elements.canvas.height = height;
            this.elements.canvas.classList.remove('hidden'); this.elements.memoryBoard.classList.add('hidden');
        }
    };

    // --- 4. GAME MODULES ---
    const Games = {
        
        /* PHASE PROTOCOL (SNAKE) */
        snake: {
            grid: 25, width: 32, height: 24,
            init() { UI.setupCanvas(800, 600); UI.elements.instructions.textContent = "Controls: WASD or Arrows to maneuver"; this.reset(); },
            reset() {
                this.snake = [{x: 10, y: 10}, {x: 9, y: 10}, {x: 8, y: 10}];
                this.dir = {x: 1, y: 0}; this.nextDir = {x: 1, y: 0};
                this.score = 0; this.frameCount = 0; this.spawnFood();
                UI.updateScore(this.score); FX.reset();
            },
            spawnFood() {
                let valid = false;
                while(!valid) {
                    this.food = { x: Math.floor(Math.random() * this.width), y: Math.floor(Math.random() * this.height), pulse: 0 };
                    valid = !this.snake.some(s => s.x === this.food.x && s.y === this.food.y);
                }
            },
            update() {
                if ((Input.isDown('ArrowUp') || Input.isDown('KeyW')) && this.dir.y === 0) this.nextDir = {x: 0, y: -1};
                if ((Input.isDown('ArrowDown') || Input.isDown('KeyS')) && this.dir.y === 0) this.nextDir = {x: 0, y: 1};
                if ((Input.isDown('ArrowLeft') || Input.isDown('KeyA')) && this.dir.x === 0) this.nextDir = {x: -1, y: 0};
                if ((Input.isDown('ArrowRight') || Input.isDown('KeyD')) && this.dir.x === 0) this.nextDir = {x: 1, y: 0};

                this.food.pulse += 0.1;

                if (++this.frameCount < 5) return;
                this.frameCount = 0; this.dir = this.nextDir;
                
                let head = { x: this.snake[0].x + this.dir.x, y: this.snake[0].y + this.dir.y };

                // Phase Shift (Teleport through walls)
                if (head.x < 0) head.x = this.width - 1; else if (head.x >= this.width) head.x = 0;
                if (head.y < 0) head.y = this.height - 1; else if (head.y >= this.height) head.y = 0;

                // Collision
                if (this.snake.some((s, i) => i !== 0 && s.x === head.x && s.y === head.y)) {
                    FX.spawn(head.x * this.grid, head.y * this.grid, '#a855f7', 30, 2); FX.addShake(10);
                    return App.gameOver(this.score);
                }

                this.snake.unshift(head);
                if (head.x === this.food.x && head.y === this.food.y) {
                    this.score += 10; UI.updateScore(this.score);
                    FX.spawn(this.food.x * this.grid + this.grid/2, this.food.y * this.grid + this.grid/2, '#eab308', 15);
                    this.spawnFood();
                } else { this.snake.pop(); }
            },
            draw(ctx) {
                ctx.fillStyle = '#050505'; ctx.fillRect(0, 0, 800, 600);
                
                // Food
                const fSize = (this.grid/2 - 2) + Math.sin(this.food.pulse)*2;
                ctx.fillStyle = '#eab308'; ctx.shadowBlur = 15; ctx.shadowColor = '#eab308';
                ctx.beginPath(); ctx.arc(this.food.x * this.grid + this.grid/2, this.food.y * this.grid + this.grid/2, fSize, 0, Math.PI*2); ctx.fill();
                ctx.shadowBlur = 0;

                // Snake
                this.snake.forEach((segment, i) => {
                    const isHead = i === 0;
                    ctx.fillStyle = isHead ? '#c084fc' : '#a855f7';
                    ctx.shadowBlur = isHead ? 20 : 10; ctx.shadowColor = '#a855f7';
                    const margin = isHead ? 0 : 2;
                    ctx.beginPath(); ctx.roundRect(segment.x * this.grid + margin, segment.y * this.grid + margin, this.grid - margin*2, this.grid - margin*2, 6); ctx.fill();
                });
                ctx.shadowBlur = 0;
            }
        },

        /* KINETIC DEFLECTION (BREAKOUT) */
        breakout: {
            init() { UI.setupCanvas(800, 600); UI.elements.instructions.textContent = "Controls: Left / Right Arrows to move deflector"; this.reset(); },
            reset() {
                this.ball = { x: 400, y: 500, dx: 5, dy: -5, radius: 6, trail: [] };
                this.paddle = { x: 350, y: 560, w: 100, h: 10, speed: 8 };
                this.bricks = []; this.score = 0; FX.reset();
                
                const colors = ['#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4'];
                for(let r=0; r<5; r++) {
                    for(let c=0; c<10; c++) {
                        this.bricks.push({x: c*70 + 55, y: r*35 + 60, w: 60, h: 20, active: true, color: colors[r], points: (5-r)*10});
                    }
                }
                UI.updateScore(this.score);
            },
            update() {
                if (Input.isDown('ArrowLeft')) this.paddle.x = Math.max(0, this.paddle.x - this.paddle.speed);
                if (Input.isDown('ArrowRight')) this.paddle.x = Math.min(800 - this.paddle.w, this.paddle.x + this.paddle.speed);

                // Ball Trail
                this.ball.trail.push({x: this.ball.x, y: this.ball.y});
                if (this.ball.trail.length > 10) this.ball.trail.shift();

                this.ball.x += this.ball.dx; this.ball.y += this.ball.dy;

                // Walls
                if (this.ball.x <= 0 || this.ball.x >= 800) { this.ball.dx *= -1; FX.addShake(2); }
                if (this.ball.y <= 0) { this.ball.dy *= -1; FX.addShake(2); }
                if (this.ball.y >= 600) return App.gameOver(this.score);

                // Paddle
                if (this.ball.y + this.ball.radius >= this.paddle.y && this.ball.x >= this.paddle.x && this.ball.x <= this.paddle.x + this.paddle.w) {
                    this.ball.dy = -Math.abs(this.ball.dy);
                    this.ball.dx = ((this.ball.x - (this.paddle.x + this.paddle.w/2)) / (this.paddle.w/2)) * 6;
                    FX.spawn(this.ball.x, this.paddle.y, '#fff', 5);
                }

                // Bricks
                let activeBricks = 0;
                this.bricks.forEach(b => {
                    if(b.active) {
                        activeBricks++;
                        if (this.ball.x > b.x && this.ball.x < b.x + b.w && this.ball.y - this.ball.radius < b.y + b.h && this.ball.y + this.ball.radius > b.y) {
                            b.active = false; this.ball.dy *= -1; 
                            this.score += b.points; UI.updateScore(this.score);
                            FX.spawn(b.x + b.w/2, b.y + b.h/2, b.color, 15);
                            FX.floatingText(b.x + b.w/2, b.y, `+${b.points}`, b.color);
                            FX.addShake(3);
                        }
                    }
                });
                if(activeBricks === 0) App.gameOver("VICTORY");
            },
            draw(ctx) {
                ctx.fillStyle = '#050505'; ctx.fillRect(0,0,800,600);
                
                // Trail
                ctx.beginPath();
                this.ball.trail.forEach((t, i) => {
                    ctx.lineWidth = (i / this.ball.trail.length) * this.ball.radius * 2;
                    ctx.strokeStyle = `rgba(6, 182, 212, ${i / 10})`;
                    if (i===0) ctx.moveTo(t.x, t.y); else ctx.lineTo(t.x, t.y);
                });
                ctx.stroke();

                // Ball & Paddle
                ctx.fillStyle = '#fff'; ctx.shadowBlur = 10; ctx.shadowColor = '#fff';
                ctx.beginPath(); ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI*2); ctx.fill();
                
                ctx.fillStyle = '#06b6d4'; ctx.shadowColor = '#06b6d4';
                ctx.beginPath(); ctx.roundRect(this.paddle.x, this.paddle.y, this.paddle.w, this.paddle.h, 5); ctx.fill();

                // Bricks
                this.bricks.forEach(b => { 
                    if(b.active) { 
                        ctx.fillStyle = b.color; ctx.shadowColor = b.color;
                        ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, 4); ctx.fill();
                    }
                });
                ctx.shadowBlur = 0;
            }
        },

        /* NEON MATRIX (PONG) */
        pong: {
            init() { UI.setupCanvas(800, 500); UI.elements.instructions.textContent = "Controls: W / S or Up / Down Arrows"; this.reset(); },
            reset() {
                this.p1 = { y: 200, score: 0 }; this.p2 = { y: 200, score: 0 };
                this.ball = { x: 400, y: 250, vx: 7, vy: 5, trail: [] };
                FX.reset(); UI.updateScore("0 - 0", "MATCH");
            },
            update() {
                if (Input.isDown('ArrowUp') || Input.isDown('KeyW')) this.p1.y = Math.max(0, this.p1.y - 8);
                if (Input.isDown('ArrowDown') || Input.isDown('KeyS')) this.p1.y = Math.min(400, this.p1.y + 8);

                // AI
                let center = this.p2.y + 50;
                if (center < this.ball.y - 15) this.p2.y += 5.5;
                if (center > this.ball.y + 15) this.p2.y -= 5.5;
                this.p2.y = Math.max(0, Math.min(400, this.p2.y));

                this.ball.trail.push({x: this.ball.x, y: this.ball.y});
                if(this.ball.trail.length > 8) this.ball.trail.shift();

                this.ball.x += this.ball.vx; this.ball.y += this.ball.vy;
                
                if (this.ball.y <= 0 || this.ball.y >= 500) { this.ball.vy *= -1; FX.addShake(2); }

                // Paddle Hits
                if (this.ball.x <= 35 && this.ball.y > this.p1.y && this.ball.y < this.p1.y + 100 && this.ball.vx < 0) {
                    this.ball.vx = Math.abs(this.ball.vx) * 1.05; this.ball.vy = (this.ball.y - (this.p1.y + 50)) * 0.2;
                    FX.spawn(this.ball.x, this.ball.y, '#06b6d4', 10); FX.addShake(3);
                }
                if (this.ball.x >= 765 && this.ball.y > this.p2.y && this.ball.y < this.p2.y + 100 && this.ball.vx > 0) {
                    this.ball.vx = -Math.abs(this.ball.vx) * 1.05; this.ball.vy = (this.ball.y - (this.p2.y + 50)) * 0.2;
                    FX.spawn(this.ball.x, this.ball.y, '#f43f5e', 10); FX.addShake(3);
                }

                if (this.ball.x < -20) this.scorePoint(2);
                if (this.ball.x > 820) this.scorePoint(1);
            },
            scorePoint(player) {
                FX.addShake(10);
                if (player === 1) this.p1.score++; else this.p2.score++;
                UI.updateScore(`${this.p1.score} - ${this.p2.score}`, "MATCH");
                if (this.p1.score >= 10 || this.p2.score >= 10) App.gameOver(this.p1.score > this.p2.score ? "WIN" : "LOSS");
                else this.ball = { x: 400, y: 250, vx: (player===1?-7:7), vy: (Math.random()-0.5)*10, trail: [] };
            },
            draw(ctx) {
                ctx.fillStyle = '#050505'; ctx.fillRect(0, 0, 800, 500);
                
                // Net
                ctx.setLineDash([15, 20]); ctx.beginPath(); ctx.moveTo(400, 0); ctx.lineTo(400, 500);
                ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 4; ctx.stroke(); ctx.setLineDash([]);

                // Trail
                ctx.beginPath();
                this.ball.trail.forEach((t, i) => {
                    ctx.lineWidth = (i / 8) * 12; ctx.strokeStyle = `rgba(255, 255, 255, ${i / 10})`;
                    if (i===0) ctx.moveTo(t.x, t.y); else ctx.lineTo(t.x, t.y);
                }); ctx.stroke();

                // Entities
                ctx.shadowBlur = 15;
                ctx.fillStyle = '#06b6d4'; ctx.shadowColor = '#06b6d4'; ctx.beginPath(); ctx.roundRect(15, this.p1.y, 12, 100, 6); ctx.fill();
                ctx.fillStyle = '#f43f5e'; ctx.shadowColor = '#f43f5e'; ctx.beginPath(); ctx.roundRect(773, this.p2.y, 12, 100, 6); ctx.fill();
                ctx.fillStyle = '#fff'; ctx.shadowColor = '#fff'; ctx.beginPath(); ctx.arc(this.ball.x, this.ball.y, 6, 0, Math.PI*2); ctx.fill();
                ctx.shadowBlur = 0;
            }
        },

        /* LOGIC MATCH (MEMORY) */
        memory: {
            init() {
                UI.elements.canvas.classList.add('hidden');
                UI.elements.memoryBoard.classList.remove('hidden');
                UI.elements.instructions.textContent = "Controls: Mouse Selection";
                this.reset();
            },
            reset() {
                this.moves = 0; this.matches = 0; this.flipped = []; this.locked = false;
                UI.updateScore(this.moves, "OPERATIONS");
                
                // Logic & Math Theme
                const symbols = ['∑', 'π', '∞', '∆', 'Ω', '∫', '≠', 'µ'];
                this.deck = [...symbols, ...symbols].sort(() => Math.random() - 0.5);
                this.renderBoard();
            },
            renderBoard() {
                const board = UI.elements.memoryBoard;
                board.innerHTML = '';
                this.deck.forEach((symbol, i) => {
                    const card = document.createElement('div');
                    card.className = 'memory-card'; card.dataset.id = i;
                    card.innerHTML = `
                        <div class="memory-card-inner">
                            <div class="memory-card-front">?</div>
                            <div class="memory-card-back">${symbol}</div>
                        </div>
                    `;
                    card.addEventListener('click', () => this.flipCard(card, symbol));
                    board.appendChild(card);
                });
            },
            flipCard(card, symbol) {
                if (this.locked || card.classList.contains('flipped') || card.classList.contains('matched')) return;
                card.classList.add('flipped');
                this.flipped.push({card, symbol});

                if (this.flipped.length === 2) {
                    this.moves++; UI.updateScore(this.moves, "OPERATIONS"); this.locked = true;
                    if (this.flipped[0].symbol === this.flipped[1].symbol) {
                        this.matches++; 
                        setTimeout(() => {
                            this.flipped.forEach(f => f.card.classList.add('matched'));
                            this.flipped = []; this.locked = false;
                            if (this.matches === 8) App.gameOver(this.moves);
                        }, 400);
                    } else {
                        setTimeout(() => {
                            this.flipped.forEach(f => f.card.classList.remove('flipped'));
                            this.flipped = []; this.locked = false;
                        }, 800);
                    }
                }
            },
            update() {}, draw() {} // DOM Based
        },

        /* MECH VOID (ASTEROIDS) */
        asteroids: {
            init() { UI.setupCanvas(800, 600); UI.elements.instructions.textContent = "Controls: Arrows to Navigate, Space to Fire"; this.reset(); },
            reset() {
                this.ship = { x: 400, y: 300, angle: -Math.PI/2, vx: 0, vy: 0, radius: 12 };
                this.bullets = []; this.asteroids = []; this.score = 0; FX.reset();
                for(let i=0; i<6; i++) this.spawnAsteroid();
                UI.updateScore(this.score); Input.keys['Space'] = false; 
            },
            spawnAsteroid(x, y, size = 3) {
                const verts = [];
                const r = size * 12;
                for(let j=0; j<8; j++) { verts.push(r + (Math.random()-0.5)*r*0.5); }
                this.asteroids.push({
                    x: x || Math.random()*800, y: y || Math.random()*600,
                    vx: (Math.random()-0.5)*2, vy: (Math.random()-0.5)*2,
                    size, radius: r, verts, rot: 0, drot: (Math.random()-0.5)*0.05
                });
            },
            update() {
                if (Input.isDown('ArrowLeft')) this.ship.angle -= 0.1;
                if (Input.isDown('ArrowRight')) this.ship.angle += 0.1;
                if (Input.isDown('ArrowUp')) {
                    this.ship.vx += Math.cos(this.ship.angle) * 0.25;
                    this.ship.vy += Math.sin(this.ship.angle) * 0.25;
                    // Engine Particles
                    FX.spawn(this.ship.x - Math.cos(this.ship.angle)*15, this.ship.y - Math.sin(this.ship.angle)*15, '#f97316', 2, 0.5);
                }
                
                this.ship.x = (this.ship.x + this.ship.vx + 800) % 800;
                this.ship.y = (this.ship.y + this.ship.vy + 600) % 600;
                this.ship.vx *= 0.98; this.ship.vy *= 0.98;

                if (Input.isDown('Space') && (!this.lastShot || Date.now() - this.lastShot > 200)) {
                    this.bullets.push({x: this.ship.x + Math.cos(this.ship.angle)*15, y: this.ship.y + Math.sin(this.ship.angle)*15, vx: Math.cos(this.ship.angle)*10, vy: Math.sin(this.ship.angle)*10, life: 50});
                    this.lastShot = Date.now();
                }

                this.bullets.forEach(b => { b.x+=b.vx; b.y+=b.vy; b.life--; });
                this.bullets = this.bullets.filter(b => b.life > 0);

                this.asteroids.forEach((a, aIdx) => {
                    a.x = (a.x + a.vx + 800) % 800; a.y = (a.y + a.vy + 600) % 600; a.rot += a.drot;
                    
                    let dx = this.ship.x - a.x, dy = this.ship.y - a.y;
                    if (Math.sqrt(dx*dx + dy*dy) < a.radius + this.ship.radius) {
                        FX.spawn(this.ship.x, this.ship.y, '#fff', 50, 3);
                        return App.gameOver(this.score);
                    }

                    this.bullets.forEach((b, bIdx) => {
                        let bdx = b.x - a.x, bdy = b.y - a.y;
                        if (Math.sqrt(bdx*bdx + bdy*bdy) < a.radius) {
                            this.bullets.splice(bIdx, 1); this.asteroids.splice(aIdx, 1);
                            this.score += a.size * 100; UI.updateScore(this.score);
                            FX.spawn(a.x, a.y, '#f97316', 20); FX.addShake(a.size * 2);
                            if (a.size > 1) { this.spawnAsteroid(a.x, a.y, a.size-1); this.spawnAsteroid(a.x, a.y, a.size-1); }
                            if (this.asteroids.length === 0) { for(let i=0; i<6; i++) this.spawnAsteroid(); }
                        }
                    });
                });
            },
            draw(ctx) {
                ctx.fillStyle = '#050505'; ctx.fillRect(0,0,800,600);
                
                ctx.save(); ctx.translate(this.ship.x, this.ship.y); ctx.rotate(this.ship.angle);
                ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.shadowBlur = 10; ctx.shadowColor = '#fff';
                ctx.beginPath(); ctx.moveTo(15, 0); ctx.lineTo(-12, -10); ctx.lineTo(-6, 0); ctx.lineTo(-12, 10); ctx.closePath(); ctx.stroke();
                ctx.restore();

                ctx.fillStyle = '#3b82f6'; ctx.shadowColor = '#3b82f6';
                this.bullets.forEach(b => { ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, Math.PI*2); ctx.fill(); });

                ctx.strokeStyle = '#f97316'; ctx.lineWidth = 2; ctx.shadowColor = '#f97316';
                this.asteroids.forEach(a => {
                    ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(a.rot);
                    ctx.beginPath();
                    for(let j=0; j<8; j++) {
                        let ang = (j/8) * Math.PI*2;
                        let px = Math.cos(ang) * a.verts[j]; let py = Math.sin(ang) * a.verts[j];
                        if(j===0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
                    }
                    ctx.closePath(); ctx.stroke(); ctx.restore();
                });
                ctx.shadowBlur = 0;
            }
        },

        /* CYBER DASH (RUNNER) */
        runner: {
            init() { UI.setupCanvas(800, 400); UI.elements.instructions.textContent = "Controls: Space or Up Arrow to Jump"; this.reset(); },
            reset() {
                this.player = { y: 320, vy: 0, s: 30, isJumping: false, rot: 0 };
                this.obstacles = []; this.particles = []; this.score = 0; this.frame = 0; this.speed = 7;
                FX.reset(); UI.updateScore(this.score, "DISTANCE");
            },
            update() {
                this.frame++;
                if (this.frame % 5 === 0) { this.score++; UI.updateScore(this.score, "DISTANCE"); }
                if (this.frame % 400 === 0) this.speed += 0.5;

                if ((Input.isDown('Space') || Input.isDown('ArrowUp')) && !this.player.isJumping) {
                    this.player.vy = -14; this.player.isJumping = true;
                    FX.spawn(100 + this.player.s/2, this.player.y + this.player.s, '#fff', 10, 0.5); // Jump dust
                }
                
                this.player.vy += 0.7; this.player.y += this.player.vy;
                if (this.player.isJumping) this.player.rot += 0.1;

                if (this.player.y >= 320) { 
                    this.player.y = 320; this.player.vy = 0; 
                    if(this.player.isJumping) { this.player.rot = 0; FX.addShake(2); }
                    this.player.isJumping = false; 
                }

                // Trail
                if(this.frame % 3 === 0) this.particles.push({x: 100, y: this.player.y, life: 1});
                this.particles.forEach(p => { p.x -= this.speed; p.life -= 0.05; });
                this.particles = this.particles.filter(p => p.life > 0);

                if (Math.random() < 0.015 && (this.obstacles.length === 0 || this.obstacles[this.obstacles.length-1].x < 500)) {
                    this.obstacles.push({ x: 800, y: 310, w: 25, h: 40 + Math.random()*20 });
                }

                this.obstacles.forEach(obs => obs.x -= this.speed);
                this.obstacles = this.obstacles.filter(obs => obs.x > -50);

                this.obstacles.forEach(obs => {
                    if (100 < obs.x + obs.w && 100 + this.player.s > obs.x && this.player.y < obs.y + obs.h && this.player.y + this.player.s > obs.y) {
                        FX.spawn(100+15, this.player.y+15, '#22c55e', 30, 2); FX.addShake(15);
                        App.gameOver(this.score);
                    }
                });
            },
            draw(ctx) {
                // Cyber background gradient
                const grad = ctx.createLinearGradient(0,0,0,400);
                grad.addColorStop(0, '#050505'); grad.addColorStop(1, '#022c22');
                ctx.fillStyle = grad; ctx.fillRect(0,0,800,400);
                
                // Moving Grid Floor
                ctx.strokeStyle = 'rgba(34, 197, 94, 0.2)'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(0, 350); ctx.lineTo(800, 350); ctx.stroke();
                let offset = (this.frame * this.speed) % 40;
                for(let i = -offset; i < 800; i += 40) { ctx.beginPath(); ctx.moveTo(i, 350); ctx.lineTo(i-40, 400); ctx.stroke(); }
                
                // Player Trail
                ctx.fillStyle = '#22c55e';
                this.particles.forEach(p => { ctx.globalAlpha = p.life; ctx.fillRect(p.x, p.y, this.player.s, this.player.s); });
                ctx.globalAlpha = 1;

                // Player Cube
                ctx.save(); ctx.translate(100 + this.player.s/2, this.player.y + this.player.s/2); ctx.rotate(this.player.rot);
                ctx.fillStyle = '#fff'; ctx.shadowBlur = 20; ctx.shadowColor = '#fff';
                ctx.fillRect(-this.player.s/2, -this.player.s/2, this.player.s, this.player.s);
                ctx.restore();
                
                // Obstacles
                ctx.fillStyle = '#22c55e'; ctx.shadowColor = '#22c55e';
                this.obstacles.forEach(obs => { ctx.fillRect(obs.x, obs.y, obs.w, obs.h); });
                ctx.shadowBlur = 0;
            }
        }
    };

    // --- 5. MAIN APPLICATION ENGINE ---
    const App = {
        activeGame: null, loopId: null, isRunning: false,

        init() {
            Input.init();
            document.querySelectorAll('.game-card').forEach(card => card.addEventListener('click', () => this.loadGame(card.dataset.game)));
            document.getElementById('btn-back').addEventListener('click', () => this.returnToMenu());
            document.getElementById('btn-menu').addEventListener('click', () => this.returnToMenu());
            document.getElementById('btn-start').addEventListener('click', () => this.startGame());
            document.getElementById('btn-restart').addEventListener('click', () => { UI.hideGameOver(); this.startGame(); });
        },

        loadGame(gameId) {
            this.activeGame = Games[gameId];
            if (this.activeGame) { UI.showView('game'); this.activeGame.init(); }
        },

        startGame() {
            if (!this.activeGame) return;
            Input.reset(); this.activeGame.reset(); this.isRunning = true;
            if (this.loopId) cancelAnimationFrame(this.loopId);
            this.gameLoop();
        },

        gameLoop() {
            if (!this.isRunning) return;
            
            if (this.activeGame) {
                this.activeGame.update();
                
                if (!UI.elements.canvas.classList.contains('hidden')) {
                    const ctx = UI.elements.ctx;
                    FX.update();
                    ctx.save();
                    FX.applyShake(ctx);
                    this.activeGame.draw(ctx);
                    FX.draw(ctx);
                    ctx.restore();
                }
            }
            this.loopId = requestAnimationFrame(() => this.gameLoop());
        },

        gameOver(finalScore) {
            this.isRunning = false; cancelAnimationFrame(this.loopId);
            setTimeout(() => UI.showGameOver(finalScore), 500); // Wait for death animations
        },

        returnToMenu() {
            this.isRunning = false; cancelAnimationFrame(this.loopId);
            this.activeGame = null; UI.hideGameOver(); UI.showView('menu');
        }
    };

    window.addEventListener('DOMContentLoaded', () => App.init());
})();
