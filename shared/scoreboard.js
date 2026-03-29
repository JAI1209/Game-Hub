window.GameHub = window.GameHub || {};

(() => {
  const { config, storage } = window.GameHub;

  if (!config || !storage) {
    return;
  }

  const gameMap = config.games.reduce((map, game) => {
    map[game.id] = game;
    return map;
  }, {});

  function sortByScore(entries) {
    return [...entries].sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return new Date(right.playedAt) - new Date(left.playedAt);
    });
  }

  function sortByDate(entries) {
    return [...entries].sort((left, right) => new Date(right.playedAt) - new Date(left.playedAt));
  }

  function getResolvedPlayerName(overrideName) {
    return storage.normalizePlayerName(overrideName) || storage.getProfileName() || config.defaultPlayerName;
  }

  function registerSession({ gameId, score, result, detail = "", playerName = "" }) {
    const game = gameMap[gameId];

    if (!game || gameId === "leaderboard") {
      return null;
    }

    const entry = {
      id: `entry-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      gameId,
      gameName: game.name,
      playerName: getResolvedPlayerName(playerName),
      score: Number.isFinite(Number(score)) ? Math.max(0, Math.round(Number(score))) : 0,
      result: result || "Completed session",
      detail,
      playedAt: new Date().toISOString()
    };

    const nextEntries = sortByScore([entry, ...storage.getLeaderboardEntries()]).slice(0, config.leaderboardMaxEntries);
    storage.setLeaderboardEntries(nextEntries);
    return entry;
  }

  function getLeaderboard(limit) {
    const entries = sortByScore(storage.getLeaderboardEntries());
    return typeof limit === "number" ? entries.slice(0, limit) : entries;
  }

  function getLeaderboardPreview(limit) {
    return getLeaderboard(limit);
  }

  function getGameSummary(gameId) {
    const gameEntries = getLeaderboard().filter((entry) => entry.gameId === gameId);
    const recentEntries = sortByDate(gameEntries);

    return {
      gameId,
      plays: gameEntries.length,
      bestScore: gameEntries[0] ? gameEntries[0].score : 0,
      bestEntry: gameEntries[0] || null,
      lastEntry: recentEntries[0] || null
    };
  }

  function getDashboardStats() {
    const entries = getLeaderboard();
    const byDate = sortByDate(entries);
    const counts = entries.reduce((map, entry) => {
      map[entry.gameId] = (map[entry.gameId] || 0) + 1;
      return map;
    }, {});

    const favoriteGameId = Object.keys(counts).sort((left, right) => counts[right] - counts[left])[0] || "";

    return {
      totalGamesPlayed: entries.length,
      bestEntry: entries[0] || null,
      lastPlayed: byDate[0] || null,
      favoriteGame: favoriteGameId ? { gameId: favoriteGameId, count: counts[favoriteGameId] } : null,
      topPlayer: entries[0] ? entries[0].playerName : ""
    };
  }

  function clearLeaderboard() {
    storage.clearLeaderboard();
  }

  window.GameHub.scoreboard = {
    registerSession,
    getLeaderboard,
    getLeaderboardPreview,
    getDashboardStats,
    getGameSummary,
    clearLeaderboard
  };
})();
