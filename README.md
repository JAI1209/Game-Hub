# Game Hub

Game Hub is a multi-game web dashboard built with HTML, CSS, and Vanilla JavaScript. It includes a clean game-hub style dashboard, local player profile support, shared localStorage-backed scoring, and standalone pages for each game.

## Included Games

- Tic Tac Toe with win detection, draw handling, restart controls, and round score tracking
- Snake with grid-based movement, score tracking, and increasing speed
- Memory with move counting, timer tracking, and match detection
- Rock Paper Scissors with a first-to-five match flow against the computer
- Global leaderboard that combines saved scores from all games

## Features

- Responsive dashboard with a featured game area and game library layout
- Player profile stored in localStorage
- Shared leaderboard and game summaries across the full app
- Minimal modular folder structure using `/games`, `/shared`, and `/styles`
- Mobile-friendly layouts for dashboard and game pages
- No frameworks or external JavaScript libraries

## Project Structure

```text
.
|-- index.html
|-- script.js
|-- games
|   |-- tic-tac-toe
|   |-- snake
|   |-- memory
|   |-- rock-paper-scissors
|   `-- leaderboard
|-- shared
|   |-- config.js
|   |-- storage.js
|   |-- scoreboard.js
|   |-- timer.js
|   `-- ui.js
`-- styles
    |-- global.css
    `-- variables.css
```

## Run Locally

1. Clone the repository.
2. Open `index.html` directly in the browser, or serve the folder with any simple static server.
3. Start from the dashboard and move into any game.

## Storage

The app stores the player name and leaderboard data locally in the browser using localStorage.

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- localStorage for persistence

## Notes

- This project is designed as a lightweight front-end portfolio piece.
- All gameplay and dashboard logic runs fully on the client.
