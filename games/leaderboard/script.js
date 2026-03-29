(() => {
  const { config, storage, scoreboard, ui } = window.GameHub || {};

  if (!config || !storage || !scoreboard || !ui) {
    return;
  }

  document.addEventListener("DOMContentLoaded", () => {
    const elements = {
      playerNameChip: document.getElementById("playerNameChip"),
      leaderboardEntriesCount: document.getElementById("leaderboardEntriesCount"),
      leaderboardTopScore: document.getElementById("leaderboardTopScore"),
      leaderboardFavoriteGame: document.getElementById("leaderboardFavoriteGame"),
      leaderboardTableBody: document.getElementById("leaderboardTableBody"),
      resetLeaderboardBtn: document.getElementById("resetLeaderboardBtn")
    };

    function render() {
      const entries = scoreboard.getLeaderboard();
      const stats = scoreboard.getDashboardStats();

      ui.setText(elements.leaderboardEntriesCount, String(entries.length));
      ui.setText(elements.leaderboardTopScore, stats.bestEntry ? String(stats.bestEntry.score) : "0");
      ui.setText(
        elements.leaderboardFavoriteGame,
        stats.favoriteGame ? ui.formatGameName(stats.favoriteGame.gameId) : "No data"
      );

      ui.renderLeaderboardRows(elements.leaderboardTableBody, entries, { variant: "full" });
    }

    elements.resetLeaderboardBtn.addEventListener("click", () => {
      const hasEntries = scoreboard.getLeaderboard().length > 0;

      if (!hasEntries) {
        ui.showToast("The leaderboard is already empty.", "error");
        return;
      }

      if (!window.confirm("Clear every saved leaderboard entry across all games?")) {
        return;
      }

      scoreboard.clearLeaderboard();
      render();
      ui.showToast("Leaderboard cleared.");
    });

    ui.setText(elements.playerNameChip, storage.getProfileName() || config.defaultPlayerName);
    render();
    ui.initializePage();
  });
})();
