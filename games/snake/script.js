(() => {
  const { config, storage, scoreboard, ui } = window.GameHub || {};

  if (!config || !storage || !scoreboard || !ui) {
    return;
  }

  document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("snakeCanvas");
    const context = canvas.getContext("2d");
    const elements = {
      playerNameChip: document.getElementById("playerNameChip"),
      snakeScoreValue: document.getElementById("snakeScoreValue"),
      snakeSpeedValue: document.getElementById("snakeSpeedValue"),
      snakeBestValue: document.getElementById("snakeBestValue"),
      snakeStatusMessage: document.getElementById("snakeStatusMessage"),
      snakeRunsValue: document.getElementById("snakeRunsValue"),
      snakeLastResult: document.getElementById("snakeLastResult"),
      snakeLastPlayed: document.getElementById("snakeLastPlayed"),
      startSnakeBtn: document.getElementById("startSnakeBtn"),
      pauseSnakeBtn: document.getElementById("pauseSnakeBtn"),
      restartSnakeBtn: document.getElementById("restartSnakeBtn"),
      snakePad: document.getElementById("snakePad")
    };

    const tileSize = config.snake.canvasSize / config.snake.boardSize;
    const directionMap = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right"
    };
    const vectors = {
      up: { x: 0, y: -1 },
      down: { x: 0, y: 1 },
      left: { x: -1, y: 0 },
      right: { x: 1, y: 0 }
    };
    const oppositeDirection = {
      up: "down",
      down: "up",
      left: "right",
      right: "left"
    };

    const state = {
      snake: [],
      direction: "right",
      nextDirection: "right",
      food: null,
      score: 0,
      speed: config.snake.initialSpeed,
      isRunning: false,
      loopId: null,
      hasRecordedRun: false
    };

    function getBestRunSummary() {
      const summary = scoreboard.getGameSummary("snake");
      ui.setText(elements.snakeBestValue, String(summary.bestScore));
      ui.setText(elements.snakeRunsValue, String(summary.plays));
      ui.setText(elements.snakeLastResult, summary.lastEntry ? summary.lastEntry.result : "No runs yet");
      ui.setText(
        elements.snakeLastPlayed,
        summary.lastEntry ? ui.formatDateTime(summary.lastEntry.playedAt) : "No activity yet"
      );
    }

    function updateHUD() {
      ui.setText(elements.snakeScoreValue, String(state.score));
      ui.setText(
        elements.snakeSpeedValue,
        state.speed <= 100 ? "Fast" : state.speed <= 140 ? "Ramping" : "Base"
      );
    }

    function clearLoop() {
      if (state.loopId !== null) {
        window.clearTimeout(state.loopId);
        state.loopId = null;
      }
    }

    function placeFood() {
      let nextFood = null;

      while (!nextFood) {
        const candidate = {
          x: Math.floor(Math.random() * config.snake.boardSize),
          y: Math.floor(Math.random() * config.snake.boardSize)
        };

        const overlapsSnake = state.snake.some((segment) => segment.x === candidate.x && segment.y === candidate.y);

        if (!overlapsSnake) {
          nextFood = candidate;
        }
      }

      state.food = nextFood;
    }

    function resetSnake() {
      clearLoop();
      state.snake = [
        { x: 7, y: 10 },
        { x: 6, y: 10 },
        { x: 5, y: 10 }
      ];
      state.direction = "right";
      state.nextDirection = "right";
      state.score = 0;
      state.speed = config.snake.initialSpeed;
      state.isRunning = false;
      state.hasRecordedRun = false;
      placeFood();
      updateHUD();
      ui.setText(elements.snakeStatusMessage, "Use arrow keys or the touch controls below to start.");
      draw();
    }

    function drawCell(x, y, color, radius = 10) {
      const drawX = x * tileSize;
      const drawY = y * tileSize;

      context.fillStyle = color;

      if (typeof context.roundRect === "function") {
        context.beginPath();
        context.roundRect(drawX + 2, drawY + 2, tileSize - 4, tileSize - 4, radius);
        context.fill();
        return;
      }

      context.fillRect(drawX + 2, drawY + 2, tileSize - 4, tileSize - 4);
    }

    function drawGrid() {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "#f0ece4";
      context.fillRect(0, 0, canvas.width, canvas.height);

      context.fillStyle = "rgba(120, 113, 104, 0.08)";
      for (let row = 0; row < config.snake.boardSize; row += 1) {
        for (let column = 0; column < config.snake.boardSize; column += 1) {
          context.fillRect(column * tileSize + 0.5, row * tileSize + 0.5, tileSize - 1, tileSize - 1);
        }
      }
    }

    function draw() {
      drawGrid();

      if (state.food) {
        drawCell(state.food.x, state.food.y, "#a97842", 12);
      }

      state.snake.forEach((segment, index) => {
        drawCell(segment.x, segment.y, index === 0 ? "#1f2937" : "#5f7a64", 10);
      });
    }

    function recordRun() {
      if (state.hasRecordedRun || state.score <= 0) {
        return;
      }

      scoreboard.registerSession({
        gameId: "snake",
        score: state.score,
        result: "Snake run ended",
        detail: `Final length ${state.snake.length}`,
        playerName: storage.getProfileName() || config.defaultPlayerName
      });

      state.hasRecordedRun = true;
      getBestRunSummary();
    }

    function gameOver() {
      clearLoop();
      state.isRunning = false;
      ui.setText(elements.snakeStatusMessage, `Game over. Final score: ${state.score}.`);
      recordRun();
    }

    function step() {
      if (!state.isRunning) {
        return;
      }

      state.direction = state.nextDirection;
      const head = state.snake[0];
      const vector = vectors[state.direction];
      const nextHead = {
        x: head.x + vector.x,
        y: head.y + vector.y
      };
      const willEatFood = Boolean(state.food && nextHead.x === state.food.x && nextHead.y === state.food.y);
      const bodyToCheck = willEatFood ? state.snake : state.snake.slice(0, -1);

      const hitWall =
        nextHead.x < 0 ||
        nextHead.y < 0 ||
        nextHead.x >= config.snake.boardSize ||
        nextHead.y >= config.snake.boardSize;
      const hitSelf = bodyToCheck.some((segment) => segment.x === nextHead.x && segment.y === nextHead.y);

      if (hitWall || hitSelf) {
        gameOver();
        draw();
        return;
      }

      state.snake.unshift(nextHead);

      if (willEatFood) {
        state.score += config.snake.foodScore;
        state.speed = Math.max(
          config.snake.minimumSpeed,
          config.snake.initialSpeed - (state.score / config.snake.foodScore) * config.snake.speedStep
        );
        placeFood();
        ui.setText(elements.snakeStatusMessage, "Food collected. The pace just picked up.");
      } else {
        state.snake.pop();
      }

      updateHUD();
      draw();
      state.loopId = window.setTimeout(step, state.speed);
    }

    function startRun() {
      if (state.isRunning) {
        return;
      }

      state.isRunning = true;
      ui.setText(elements.snakeStatusMessage, "Snake is moving. Stay inside the board.");
      step();
    }

    function pauseRun() {
      if (!state.isRunning) {
        return;
      }

      clearLoop();
      state.isRunning = false;
      ui.setText(elements.snakeStatusMessage, "Run paused. Resume when you are ready.");
    }

    function handleRestart() {
      const hasProgress = state.score > 0 || state.isRunning;

      if (hasProgress && !window.confirm("Restart the current Snake run and discard the live score?")) {
        return;
      }

      resetSnake();
      ui.showToast("Snake board reset.");
    }

    function setDirection(nextDirection) {
      if (oppositeDirection[state.direction] === nextDirection) {
        return;
      }

      state.nextDirection = nextDirection;

      if (!state.isRunning) {
        startRun();
      }
    }

    document.addEventListener("keydown", (event) => {
      const nextDirection = directionMap[event.key];

      if (!nextDirection) {
        return;
      }

      event.preventDefault();
      setDirection(nextDirection);
    });

    elements.snakePad.addEventListener("click", (event) => {
      const button = event.target.closest("[data-direction]");

      if (!button) {
        return;
      }

      setDirection(button.dataset.direction);
    });

    elements.startSnakeBtn.addEventListener("click", startRun);
    elements.pauseSnakeBtn.addEventListener("click", pauseRun);
    elements.restartSnakeBtn.addEventListener("click", handleRestart);

    ui.setText(elements.playerNameChip, storage.getProfileName() || config.defaultPlayerName);
    resetSnake();
    getBestRunSummary();
    ui.initializePage();
  });
})();
