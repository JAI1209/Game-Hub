(() => {
  const { config, storage, scoreboard, ui } = window.GameHub || {};

  if (!config || !storage || !scoreboard || !ui) {
    return;
  }

  document.addEventListener("DOMContentLoaded", () => {
    const elements = {
      profileHeading: document.getElementById("profileHeading"),
      profileCopy: document.getElementById("profileCopy"),
      profileAvatar: document.getElementById("profileAvatar"),
      profileForm: document.getElementById("profileForm"),
      playerNameInput: document.getElementById("playerNameInput"),
      editProfileBtn: document.getElementById("editProfileBtn"),
      cancelProfileBtn: document.getElementById("cancelProfileBtn"),
      totalGamesPlayed: document.getElementById("totalGamesPlayed"),
      bestScoreValue: document.getElementById("bestScoreValue"),
      bestScoreContext: document.getElementById("bestScoreContext"),
      lastPlayedGame: document.getElementById("lastPlayedGame"),
      lastPlayedTime: document.getElementById("lastPlayedTime"),
      favoriteGameValue: document.getElementById("favoriteGameValue"),
      topPlayerValue: document.getElementById("topPlayerValue"),
      leaderboardEntriesValue: document.getElementById("leaderboardEntriesValue"),
      gameGrid: document.getElementById("gameGrid"),
      leaderboardPreviewBody: document.getElementById("leaderboardPreviewBody"),
      featuredPanel: document.getElementById("featuredPanel"),
      featuredEyebrow: document.getElementById("featuredEyebrow"),
      featuredGameName: document.getElementById("featuredGameName"),
      featuredGameCopy: document.getElementById("featuredGameCopy"),
      featuredGameLink: document.getElementById("featuredGameLink"),
      featuredGameCategory: document.getElementById("featuredGameCategory"),
      featuredSessions: document.getElementById("featuredSessions"),
      featuredBestScore: document.getElementById("featuredBestScore"),
      featuredLastResult: document.getElementById("featuredLastResult")
    };

    const toneClasses = config.games
      .map((game) => game.toneClass)
      .filter((value, index, list) => Boolean(value) && list.indexOf(value) === index);

    let isEditingProfile = false;

    function setToneClass(element, toneClass) {
      if (!element) {
        return;
      }

      element.classList.remove(...toneClasses);

      if (toneClass) {
        element.classList.add(toneClass);
      }
    }

    function renderProfile() {
      const profile = storage.getProfile();
      const hasProfile = Boolean(profile.name);
      const displayName = profile.name || config.defaultPlayerName;

      ui.setText(elements.profileAvatar, ui.getInitials(displayName));
      ui.setText(
        elements.profileHeading,
        hasProfile ? `Welcome back, ${displayName}` : "Create your player profile"
      );
      ui.setText(
        elements.profileCopy,
        hasProfile
          ? "Your scores are saved on this device across every game."
          : "Set a player name to save scores and personalize the hub."
      );

      elements.editProfileBtn.classList.toggle("is-hidden", !hasProfile);
      elements.cancelProfileBtn.classList.toggle("is-hidden", !isEditingProfile || !hasProfile);
      elements.profileForm.classList.toggle("is-hidden", hasProfile && !isEditingProfile);
      elements.playerNameInput.value = profile.name || "";
      elements.playerNameInput.placeholder = hasProfile ? displayName : "Enter your player name";
      elements.editProfileBtn.textContent = isEditingProfile ? "Close editor" : "Edit name";
    }

    function renderStats() {
      const dashboardStats = scoreboard.getDashboardStats();
      const bestEntry = dashboardStats.bestEntry;
      const lastPlayed = dashboardStats.lastPlayed;

      ui.setText(elements.totalGamesPlayed, String(dashboardStats.totalGamesPlayed));
      ui.setText(elements.bestScoreValue, bestEntry ? String(bestEntry.score) : "0");
      ui.setText(
        elements.bestScoreContext,
        bestEntry ? `${ui.formatGameName(bestEntry.gameId)} - ${bestEntry.result}` : "No score history yet."
      );
      ui.setText(
        elements.lastPlayedGame,
        lastPlayed ? ui.formatGameName(lastPlayed.gameId) : "No activity yet"
      );
      ui.setText(
        elements.lastPlayedTime,
        lastPlayed ? ui.formatDateTime(lastPlayed.playedAt) : "Start any game to generate activity."
      );
      ui.setText(
        elements.favoriteGameValue,
        dashboardStats.favoriteGame ? ui.formatGameName(dashboardStats.favoriteGame.gameId) : "No data"
      );
      ui.setText(elements.topPlayerValue, dashboardStats.topPlayer || "No data");
      ui.setText(elements.leaderboardEntriesValue, String(dashboardStats.totalGamesPlayed));
    }

    function renderFeaturedGame() {
      const dashboardStats = scoreboard.getDashboardStats();
      const featuredGameId = dashboardStats.lastPlayed ? dashboardStats.lastPlayed.gameId : "snake";
      const featuredGame = config.games.find((game) => game.id === featuredGameId) || config.games[1];
      const summary = scoreboard.getGameSummary(featuredGame.id);
      const hasHistory = Boolean(summary.lastEntry);

      setToneClass(elements.featuredPanel, featuredGame.toneClass);
      ui.setText(elements.featuredEyebrow, hasHistory ? "Continue playing" : "Recommended start");
      ui.setText(elements.featuredGameName, featuredGame.name);
      ui.setText(
        elements.featuredGameCopy,
        hasHistory
          ? `${summary.lastEntry.result}. Jump back in and try to beat your last run.`
          : featuredGame.description
      );
      elements.featuredGameLink.href = featuredGame.path;
      elements.featuredGameLink.textContent = hasHistory ? `Play ${featuredGame.name}` : "Start now";
      ui.setText(elements.featuredGameCategory, featuredGame.category);
      ui.setText(elements.featuredSessions, String(summary.plays));
      ui.setText(elements.featuredBestScore, String(summary.bestScore));
      ui.setText(elements.featuredLastResult, summary.lastEntry ? summary.lastEntry.result : "New game");
    }

    function renderGameGrid() {
      const dashboardStats = scoreboard.getDashboardStats();
      const entriesMarkup = config.games
        .map((game) => {
          if (game.id === "leaderboard") {
            return `
              <a class="glass-card game-card ${game.toneClass}" href="${game.path}">
                <div class="game-card-head">
                  <span class="card-badge">${game.category}</span>
                  <span class="card-status">${dashboardStats.totalGamesPlayed} entries</span>
                </div>
                <div class="game-card-body">
                  <span class="card-icon">${game.shortLabel}</span>
                  <div class="card-copy">
                    <h3>${game.name}</h3>
                    <p>${game.description}</p>
                  </div>
                </div>
                <div class="card-meta">
                  <span>Top score ${dashboardStats.bestEntry ? dashboardStats.bestEntry.score : 0}</span>
                  <span class="card-link-strong">Open board</span>
                </div>
              </a>
            `;
          }

          const summary = scoreboard.getGameSummary(game.id);
          return `
            <a class="glass-card game-card ${game.toneClass}" href="${game.path}">
              <div class="game-card-head">
                <span class="card-badge">${game.category}</span>
                <span class="card-status">${summary.plays ? `${summary.plays} sessions` : "Ready to play"}</span>
              </div>
              <div class="game-card-body">
                <span class="card-icon">${game.shortLabel}</span>
                <div class="card-copy">
                  <h3>${game.name}</h3>
                  <p>${game.description}</p>
                </div>
              </div>
              <div class="card-meta">
                <span>${summary.plays ? `Best ${summary.bestScore}` : "No score yet"}</span>
                <span class="card-link-strong">${summary.lastEntry ? "Play again" : "Play now"}</span>
              </div>
            </a>
          `;
        })
        .join("");

      elements.gameGrid.innerHTML = entriesMarkup;
    }

    function renderLeaderboardPreview() {
      ui.renderLeaderboardRows(
        elements.leaderboardPreviewBody,
        scoreboard.getLeaderboardPreview(config.leaderboardPreviewLimit),
        { variant: "compact" }
      );
    }

    function rerender() {
      renderProfile();
      renderStats();
      renderFeaturedGame();
      renderGameGrid();
      renderLeaderboardPreview();
    }

    elements.profileForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const result = storage.setProfileName(elements.playerNameInput.value);

      if (!result.ok) {
        ui.showToast(result.error, "error");
        elements.playerNameInput.focus();
        return;
      }

      isEditingProfile = false;
      rerender();
      ui.showToast("Player profile saved.");
    });

    elements.editProfileBtn.addEventListener("click", () => {
      isEditingProfile = !isEditingProfile;
      renderProfile();
      if (isEditingProfile) {
        elements.playerNameInput.focus();
        elements.playerNameInput.select();
      }
    });

    elements.cancelProfileBtn.addEventListener("click", () => {
      isEditingProfile = false;
      renderProfile();
    });

    rerender();
    ui.initializePage();
  });
})();
