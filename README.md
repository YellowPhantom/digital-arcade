# ARCADE.OS

A premium, retro-futuristic digital arcade built with vanilla HTML, CSS, and JavaScript. Features a sleek glassmorphism UI and a robust, modular game engine.

## 🚀 Live Demo
[View on Vercel](https://digital-arcade-sigma.vercel.app/)

## 🎮 Included Modules
1. **Snake Protocol:** Classic grid-based snake.
2. **Breakout Blitz:** Physics-based block breaker.
3. **Neon Pong:** Classic pong with local AI.
4. **Memory Match:** RAM optimization (card flipping) mini-game.
5. **Asteroid Blaster:** 360-degree space shooter.
6. **Endless Runner:** Infinite scrolling evasion game.

## 🛠️ Architecture Highlights
* **Zero Dependencies:** Written in vanilla JS. Uses the lightweight `lucide` CDN solely for crisp SVG iconography.
* **Modular Game Loop:** The main logic is wrapped in a self-executing anonymous function (IIFE) using `requestAnimationFrame`, meaning games swap seamlessly without overlapping logic.
* **Memory-Leak Free:** Input listeners (`addEventListener`) are attached only *once* upon app initialization, rather than on every game restart, eliminating severe performance lag.
* **Premium UI:** Uses CSS variables, `backdrop-filter` for frosted glass effects, and a unified dark 'Zinc' palette.

## 📦 Deployment (Vercel)

This project requires zero build steps or bundlers. To update your existing Vercel deployment:

1. Ensure your repository has the three files separated properly:
   - `index.html`
   - `styles.css`
   - `main.js`
2. Push your changes to your GitHub/GitLab repository connected to Vercel.
3. Vercel will automatically detect the static `index.html` file and deploy the site instantly.
