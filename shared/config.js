window.GameHub = window.GameHub || {};

(() => {
  const games = [
    {
      id: "tic-tac-toe",
      name: "Tic Tac Toe",
      shortLabel: "TTT",
      path: "games/tic-tac-toe/index.html",
      category: "Strategy",
      toneClass: "tone-ink",
      description: "Local two-player rounds with score tracking and a quick restart."
    },
    {
      id: "snake",
      name: "Snake",
      shortLabel: "SNK",
      path: "games/snake/index.html",
      category: "Arcade",
      toneClass: "tone-sage",
      description: "Classic grid movement with score growth and faster pacing."
    },
    {
      id: "memory",
      name: "Memory",
      shortLabel: "MEM",
      path: "games/memory/index.html",
      category: "Puzzle",
      toneClass: "tone-amber",
      description: "Flip cards, track moves, and beat your best time."
    },
    {
      id: "rock-paper-scissors",
      name: "Rock Paper Scissors",
      shortLabel: "RPS",
      path: "games/rock-paper-scissors/index.html",
      category: "Casual",
      toneClass: "tone-clay",
      description: "Play a simple first-to-five match against the computer."
    },
    {
      id: "leaderboard",
      name: "Leaderboard",
      shortLabel: "TOP",
      path: "games/leaderboard/index.html",
      category: "Records",
      toneClass: "tone-ink",
      description: "See all saved scores from every game in one place."
    }
  ];

  window.GameHub.config = Object.freeze({
    appName: "Game Hub",
    storageKey: "gameHub.state.v1",
    defaultPlayerName: "Player One",
    playerNameMinLength: 2,
    playerNameMaxLength: 18,
    leaderboardPreviewLimit: 5,
    leaderboardMaxEntries: 120,
    games,
    ticTacToe: {
      winPatterns: [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6]
      ]
    },
    snake: {
      boardSize: 20,
      canvasSize: 420,
      initialSpeed: 170,
      minimumSpeed: 85,
      speedStep: 8,
      foodScore: 10
    },
    memory: {
      pairTokens: ["ARC", "BYTE", "CORE", "DASH", "ECHO", "FLIP", "GLOW", "NOVA"],
      mismatchDelay: 700
    },
    rps: {
      choices: ["rock", "paper", "scissors"],
      matchTarget: 5
    }
  });
})();
