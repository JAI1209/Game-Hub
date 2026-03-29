(() => {
  const { config, storage, scoreboard, timer, ui } = window.GameHub || {};

  if (!config || !storage || !scoreboard || !timer || !ui) {
    return;
  }

  document.addEventListener("DOMContentLoaded", () => {
    const elements = {
      playerNameChip: document.getElementById("playerNameChip"),
      memoryBoard: document.getElementById("memoryBoard"),
      memoryMovesValue: document.getElementById("memoryMovesValue"),
      memoryTimerValue: document.getElementById("memoryTimerValue"),
      memoryMatchesValue: document.getElementById("memoryMatchesValue"),
      memoryStatusMessage: document.getElementById("memoryStatusMessage"),
      memoryBestValue: document.getElementById("memoryBestValue"),
      memoryRunsValue: document.getElementById("memoryRunsValue"),
      memoryLastResult: document.getElementById("memoryLastResult"),
      memoryLastPlayed: document.getElementById("memoryLastPlayed"),
      restartMemoryBtn: document.getElementById("restartMemoryBtn")
    };

    const state = {
      cards: [],
      activeIndexes: [],
      matchedPairs: 0,
      moves: 0,
      isLocked: false,
      hasStarted: false,
      hasFinished: false
    };

    const memoryTimer = timer.createTimer({
      onTick(seconds) {
        ui.setText(elements.memoryTimerValue, timer.format(seconds));
      }
    });

    function shuffle(values) {
      const shuffled = [...values];

      for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
      }

      return shuffled;
    }

    function buildDeck() {
      const values = shuffle([...config.memory.pairTokens, ...config.memory.pairTokens]);

      state.cards = values.map((value, index) => ({
        id: `${value}-${index}`,
        value,
        isFlipped: false,
        isMatched: false
      }));
    }

    function updateHUD() {
      ui.setText(elements.memoryMovesValue, String(state.moves));
      ui.setText(elements.memoryMatchesValue, `${state.matchedPairs} / ${config.memory.pairTokens.length}`);
    }

    function updateHubSummary() {
      const summary = scoreboard.getGameSummary("memory");
      ui.setText(elements.memoryBestValue, String(summary.bestScore));
      ui.setText(elements.memoryRunsValue, String(summary.plays));
      ui.setText(elements.memoryLastResult, summary.lastEntry ? summary.lastEntry.result : "No runs yet");
      ui.setText(
        elements.memoryLastPlayed,
        summary.lastEntry ? ui.formatDateTime(summary.lastEntry.playedAt) : "No activity yet"
      );
    }

    function updateCard(index) {
      const card = state.cards[index];
      const button = elements.memoryBoard.querySelector(`[data-index="${index}"]`);

      if (!button) {
        return;
      }

      button.classList.toggle("is-flipped", card.isFlipped);
      button.classList.toggle("is-matched", card.isMatched);
      button.disabled = card.isMatched;
    }

    function renderBoard() {
      ui.clearChildren(elements.memoryBoard);
      const fragment = document.createDocumentFragment();

      state.cards.forEach((card, index) => {
        const button = document.createElement("button");
        const back = document.createElement("span");
        const front = document.createElement("span");

        button.className = "memory-card";
        button.type = "button";
        button.dataset.index = String(index);
        button.setAttribute("aria-label", "Memory card");

        back.className = "memory-card-face memory-card-back";
        back.textContent = "Flip";

        front.className = "memory-card-face memory-card-front";
        front.textContent = card.value;

        button.append(back, front);
        fragment.appendChild(button);
      });

      elements.memoryBoard.appendChild(fragment);
    }

    function calculateScore() {
      const elapsedSeconds = memoryTimer.getSeconds();
      return Math.max(30, 320 - elapsedSeconds * 3 - state.moves * 4);
    }

    function finishGame() {
      state.hasFinished = true;
      memoryTimer.pause();
      const elapsedSeconds = memoryTimer.getSeconds();
      const score = calculateScore();

      ui.setText(
        elements.memoryStatusMessage,
        `Board complete in ${timer.format(elapsedSeconds)} with ${state.moves} moves.`
      );

      scoreboard.registerSession({
        gameId: "memory",
        score,
        result: "Memory board cleared",
        detail: `${state.moves} moves in ${timer.format(elapsedSeconds)}`,
        playerName: storage.getProfileName() || config.defaultPlayerName
      });

      updateHubSummary();
      ui.showToast("Memory run saved to the leaderboard.");
    }

    function flipCard(index) {
      const card = state.cards[index];

      if (!card || card.isMatched || card.isFlipped || state.isLocked || state.hasFinished) {
        return;
      }

      if (!state.hasStarted) {
        state.hasStarted = true;
        memoryTimer.start();
        ui.setText(elements.memoryStatusMessage, "Match the pairs as quickly as you can.");
      }

      card.isFlipped = true;
      state.activeIndexes.push(index);
      updateCard(index);

      if (state.activeIndexes.length < 2) {
        return;
      }

      state.isLocked = true;
      state.moves += 1;
      updateHUD();

      const [firstIndex, secondIndex] = state.activeIndexes;
      const firstCard = state.cards[firstIndex];
      const secondCard = state.cards[secondIndex];

      if (firstCard.value === secondCard.value) {
        firstCard.isMatched = true;
        secondCard.isMatched = true;
        state.matchedPairs += 1;
        state.activeIndexes = [];
        state.isLocked = false;
        updateCard(firstIndex);
        updateCard(secondIndex);
        updateHUD();

        if (state.matchedPairs === config.memory.pairTokens.length) {
          finishGame();
        }

        return;
      }

      window.setTimeout(() => {
        firstCard.isFlipped = false;
        secondCard.isFlipped = false;
        state.activeIndexes = [];
        state.isLocked = false;
        updateCard(firstIndex);
        updateCard(secondIndex);
      }, config.memory.mismatchDelay);
    }

    function resetMemory() {
      buildDeck();
      state.activeIndexes = [];
      state.matchedPairs = 0;
      state.moves = 0;
      state.isLocked = false;
      state.hasStarted = false;
      state.hasFinished = false;
      memoryTimer.stop(0);
      renderBoard();
      updateHUD();
      ui.setText(elements.memoryStatusMessage, "Flip any card to start the timer.");
    }

    elements.memoryBoard.addEventListener("click", (event) => {
      const button = event.target.closest(".memory-card");

      if (!button) {
        return;
      }

      flipCard(Number(button.dataset.index));
    });

    elements.restartMemoryBtn.addEventListener("click", () => {
      const hasProgress = state.hasStarted && !state.hasFinished;

      if (hasProgress && !window.confirm("Restart the current memory board and reset the timer?")) {
        return;
      }

      resetMemory();
      ui.showToast("Memory board reset.");
    });

    ui.setText(elements.playerNameChip, storage.getProfileName() || config.defaultPlayerName);
    resetMemory();
    updateHubSummary();
    ui.initializePage();
  });
})();
