(() => {
  const { config, storage, scoreboard, ui } = window.GameHub || {};

  if (!config || !storage || !scoreboard || !ui) {
    return;
  }

  document.addEventListener("DOMContentLoaded", () => {
    const elements = {
      playerNameChip: document.getElementById("playerNameChip"),
      rpsPlayerScore: document.getElementById("rpsPlayerScore"),
      rpsComputerScore: document.getElementById("rpsComputerScore"),
      rpsTargetScore: document.getElementById("rpsTargetScore"),
      playerChoiceValue: document.getElementById("playerChoiceValue"),
      computerChoiceValue: document.getElementById("computerChoiceValue"),
      playerChoiceCard: document.getElementById("playerChoiceCard"),
      computerChoiceCard: document.getElementById("computerChoiceCard"),
      rpsResultBanner: document.getElementById("rpsResultBanner"),
      rpsChoices: document.getElementById("rpsChoices"),
      resetRpsBtn: document.getElementById("resetRpsBtn"),
      rpsBestValue: document.getElementById("rpsBestValue"),
      rpsRunsValue: document.getElementById("rpsRunsValue"),
      rpsLastResult: document.getElementById("rpsLastResult"),
      rpsLastPlayed: document.getElementById("rpsLastPlayed")
    };

    const state = {
      playerScore: 0,
      computerScore: 0,
      rounds: 0,
      isMatchComplete: false
    };

    const winningMap = {
      rock: "scissors",
      paper: "rock",
      scissors: "paper"
    };

    function titleCase(value) {
      return value.charAt(0).toUpperCase() + value.slice(1);
    }

    function updateScoreboard() {
      ui.setText(elements.rpsPlayerScore, String(state.playerScore));
      ui.setText(elements.rpsComputerScore, String(state.computerScore));
      ui.setText(elements.rpsTargetScore, String(config.rps.matchTarget));
    }

    function updateHubSummary() {
      const summary = scoreboard.getGameSummary("rock-paper-scissors");
      ui.setText(elements.rpsBestValue, String(summary.bestScore));
      ui.setText(elements.rpsRunsValue, String(summary.plays));
      ui.setText(elements.rpsLastResult, summary.lastEntry ? summary.lastEntry.result : "No matches yet");
      ui.setText(
        elements.rpsLastPlayed,
        summary.lastEntry ? ui.formatDateTime(summary.lastEntry.playedAt) : "No activity yet"
      );
    }

    function setChoiceCards(playerChoice, computerChoice, stateLabel) {
      ui.setText(elements.playerChoiceValue, playerChoice ? titleCase(playerChoice) : "Waiting");
      ui.setText(elements.computerChoiceValue, computerChoice ? titleCase(computerChoice) : "Waiting");

      elements.playerChoiceCard.classList.remove("is-win", "is-loss");
      elements.computerChoiceCard.classList.remove("is-win", "is-loss");

      if (stateLabel === "win") {
        elements.playerChoiceCard.classList.add("is-win");
        elements.computerChoiceCard.classList.add("is-loss");
      } else if (stateLabel === "loss") {
        elements.playerChoiceCard.classList.add("is-loss");
        elements.computerChoiceCard.classList.add("is-win");
      }
    }

    function setResultBanner(message, stateLabel) {
      elements.rpsResultBanner.dataset.state = stateLabel;
      elements.rpsResultBanner.textContent = message;
    }

    function completeMatch() {
      state.isMatchComplete = true;
      const playerWon = state.playerScore > state.computerScore;
      const score = playerWon ? state.playerScore * 10 : state.playerScore * 5 + 5;

      scoreboard.registerSession({
        gameId: "rock-paper-scissors",
        score,
        result: playerWon ? "Player won the match" : "Computer won the match",
        detail: `${state.playerScore}-${state.computerScore} across ${state.rounds} rounds`,
        playerName: storage.getProfileName() || config.defaultPlayerName
      });

      setResultBanner(
        playerWon
          ? "Match complete. You reached the target first."
          : "Match complete. The computer reached the target first.",
        playerWon ? "win" : "loss"
      );

      updateHubSummary();
    }

    function playRound(choice) {
      if (state.isMatchComplete) {
        return;
      }

      const computerChoice =
        config.rps.choices[Math.floor(Math.random() * config.rps.choices.length)];

      state.rounds += 1;

      if (choice === computerChoice) {
        setChoiceCards(choice, computerChoice, "draw");
        setResultBanner("Round draw. Pick again.", "draw");
        return;
      }

      const playerWon = winningMap[choice] === computerChoice;

      if (playerWon) {
        state.playerScore += 1;
        setChoiceCards(choice, computerChoice, "win");
        setResultBanner(`You win the round with ${titleCase(choice)}.`, "win");
      } else {
        state.computerScore += 1;
        setChoiceCards(choice, computerChoice, "loss");
        setResultBanner(`Computer wins the round with ${titleCase(computerChoice)}.`, "loss");
      }

      updateScoreboard();

      if (
        state.playerScore >= config.rps.matchTarget ||
        state.computerScore >= config.rps.matchTarget
      ) {
        completeMatch();
      }
    }

    function resetMatch(force = false) {
      const hasProgress = state.playerScore > 0 || state.computerScore > 0 || state.rounds > 0;

      if (!force && hasProgress && !state.isMatchComplete) {
        const shouldReset = window.confirm("Reset the active Rock Paper Scissors match?");

        if (!shouldReset) {
          return;
        }
      }

      state.playerScore = 0;
      state.computerScore = 0;
      state.rounds = 0;
      state.isMatchComplete = false;
      updateScoreboard();
      setChoiceCards("", "", "idle");
      setResultBanner("First to five wins takes the match.", "idle");
    }

    elements.rpsChoices.addEventListener("click", (event) => {
      const button = event.target.closest("[data-choice]");

      if (!button) {
        return;
      }

      elements.rpsChoices.querySelectorAll(".choice-btn").forEach((node) => {
        node.classList.toggle("is-active", node === button);
      });

      playRound(button.dataset.choice);
    });

    elements.resetRpsBtn.addEventListener("click", () => {
      resetMatch();
      ui.showToast("Rock Paper Scissors match reset.");
    });

    ui.setText(elements.playerNameChip, storage.getProfileName() || config.defaultPlayerName);
    resetMatch(true);
    updateHubSummary();
    ui.initializePage();
  });
})();
