(() => {
  const { config, storage, scoreboard, ui } = window.GameHub || {};

  if (!config || !storage || !scoreboard || !ui) {
    return;
  }

  document.addEventListener("DOMContentLoaded", () => {
    const cells = Array.from(document.querySelectorAll(".ttt-cell"));
    const elements = {
      playerNameChip: document.getElementById("playerNameChip"),
      turnLabel: document.getElementById("turnLabel"),
      roundStatus: document.getElementById("roundStatus"),
      statusMessage: document.getElementById("statusMessage"),
      xWinsValue: document.getElementById("xWinsValue"),
      oWinsValue: document.getElementById("oWinsValue"),
      drawsValue: document.getElementById("drawsValue"),
      tttBestScore: document.getElementById("tttBestScore"),
      tttRoundsValue: document.getElementById("tttRoundsValue"),
      tttLastResult: document.getElementById("tttLastResult"),
      tttLastPlayed: document.getElementById("tttLastPlayed"),
      restartRoundBtn: document.getElementById("restartRoundBtn"),
      resetMatchBtn: document.getElementById("resetMatchBtn")
    };

    const state = {
      board: Array(9).fill(""),
      currentPlayer: "X",
      isRoundActive: true,
      scores: {
        X: 0,
        O: 0,
        draws: 0
      }
    };

    function updateBoardUI() {
      cells.forEach((cell, index) => {
        const value = state.board[index];
        cell.textContent = value;
        cell.dataset.value = value;
      });
    }

    function updateScoreUI() {
      ui.setText(elements.xWinsValue, String(state.scores.X));
      ui.setText(elements.oWinsValue, String(state.scores.O));
      ui.setText(elements.drawsValue, String(state.scores.draws));
      ui.setText(elements.turnLabel, `Player ${state.currentPlayer}`);
    }

    function updateHubSummary() {
      const summary = scoreboard.getGameSummary("tic-tac-toe");
      ui.setText(elements.tttBestScore, String(summary.bestScore));
      ui.setText(elements.tttRoundsValue, String(summary.plays));
      ui.setText(elements.tttLastResult, summary.lastEntry ? summary.lastEntry.result : "No rounds yet");
      ui.setText(
        elements.tttLastPlayed,
        summary.lastEntry ? ui.formatDateTime(summary.lastEntry.playedAt) : "No activity yet"
      );
    }

    function resetRound() {
      state.board = Array(9).fill("");
      state.currentPlayer = "X";
      state.isRoundActive = true;
      cells.forEach((cell) => {
        cell.classList.remove("is-win");
      });
      ui.setText(elements.roundStatus, "Ready to play");
      ui.setText(elements.statusMessage, "Player X, make the opening move.");
      updateBoardUI();
      updateScoreUI();
    }

    function setRoundFinished(message, status) {
      state.isRoundActive = false;
      ui.setText(elements.roundStatus, status);
      ui.setText(elements.statusMessage, message);
    }

    function getWinningPattern() {
      return config.ticTacToe.winPatterns.find((pattern) => {
        const [first, second, third] = pattern;
        return (
          state.board[first] &&
          state.board[first] === state.board[second] &&
          state.board[first] === state.board[third]
        );
      });
    }

    function logRound(score, result, detail, suffix = "") {
      const profileName = storage.getProfileName() || config.defaultPlayerName;

      scoreboard.registerSession({
        gameId: "tic-tac-toe",
        score,
        result,
        detail,
        playerName: suffix ? `${profileName} (${suffix})` : profileName
      });

      updateHubSummary();
    }

    function handleRoundResolution() {
      const winningPattern = getWinningPattern();

      if (winningPattern) {
        winningPattern.forEach((index) => cells[index].classList.add("is-win"));
        state.scores[state.currentPlayer] += 1;
        updateScoreUI();
        setRoundFinished(`Player ${state.currentPlayer} wins the round.`, "Round complete");
        logRound(
          10,
          `Player ${state.currentPlayer} won`,
          `Match score X ${state.scores.X} - O ${state.scores.O}`,
          state.currentPlayer
        );
        return;
      }

      if (!state.board.includes("")) {
        state.scores.draws += 1;
        updateScoreUI();
        setRoundFinished("This round is a draw.", "Round complete");
        logRound(4, "Round draw", "Board filled with no winning line");
        return;
      }

      state.currentPlayer = state.currentPlayer === "X" ? "O" : "X";
      updateScoreUI();
      ui.setText(elements.statusMessage, `Player ${state.currentPlayer}, make your move.`);
      ui.setText(elements.roundStatus, "In progress");
    }

    function handleCellClick(event) {
      const target = event.target.closest(".ttt-cell");

      if (!target || !state.isRoundActive) {
        return;
      }

      const index = Number(target.dataset.index);

      if (state.board[index]) {
        return;
      }

      state.board[index] = state.currentPlayer;
      updateBoardUI();
      handleRoundResolution();
    }

    function handleMatchReset() {
      const hasProgress =
        state.scores.X > 0 ||
        state.scores.O > 0 ||
        state.scores.draws > 0 ||
        state.board.some(Boolean);

      if (hasProgress && !window.confirm("Reset the current Tic Tac Toe match and clear the local round totals?")) {
        return;
      }

      state.scores = { X: 0, O: 0, draws: 0 };
      resetRound();
      updateScoreUI();
      ui.showToast("Tic Tac Toe match reset.");
    }

    ui.setText(elements.playerNameChip, storage.getProfileName() || config.defaultPlayerName);

    document.getElementById("tttBoard").addEventListener("click", handleCellClick);
    elements.restartRoundBtn.addEventListener("click", resetRound);
    elements.resetMatchBtn.addEventListener("click", handleMatchReset);

    resetRound();
    updateHubSummary();
    ui.initializePage();
  });
})();
