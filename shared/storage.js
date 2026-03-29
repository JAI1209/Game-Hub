window.GameHub = window.GameHub || {};

(() => {
  const { config } = window.GameHub;

  if (!config) {
    return;
  }

  const defaultState = {
    profile: {
      name: "",
      updatedAt: null
    },
    leaderboard: []
  };

  let memoryState = clone(defaultState);

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function getStorage() {
    try {
      return window.localStorage;
    } catch (error) {
      return null;
    }
  }

  function normalizePlayerName(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, config.playerNameMaxLength);
  }

  function normalizeEntry(entry) {
    const rawEntry = entry && typeof entry === "object" ? entry : {};

    return {
      id:
        typeof rawEntry.id === "string" && rawEntry.id
          ? rawEntry.id
          : `entry-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      gameId: typeof rawEntry.gameId === "string" ? rawEntry.gameId : "",
      gameName: typeof rawEntry.gameName === "string" ? rawEntry.gameName : "",
      playerName: normalizePlayerName(rawEntry.playerName) || config.defaultPlayerName,
      score: Number.isFinite(Number(rawEntry.score)) ? Math.max(0, Math.round(Number(rawEntry.score))) : 0,
      result: typeof rawEntry.result === "string" && rawEntry.result ? rawEntry.result : "Completed session",
      detail: typeof rawEntry.detail === "string" ? rawEntry.detail : "",
      playedAt: typeof rawEntry.playedAt === "string" && rawEntry.playedAt ? rawEntry.playedAt : new Date().toISOString()
    };
  }

  function normalizeState(rawState) {
    const source = rawState && typeof rawState === "object" ? rawState : {};
    const profile = source.profile && typeof source.profile === "object" ? source.profile : {};

    return {
      profile: {
        name: normalizePlayerName(profile.name),
        updatedAt: typeof profile.updatedAt === "string" ? profile.updatedAt : null
      },
      leaderboard: Array.isArray(source.leaderboard) ? source.leaderboard.map(normalizeEntry) : []
    };
  }

  function readState() {
    const storage = getStorage();

    if (!storage) {
      return clone(memoryState);
    }

    try {
      const rawState = storage.getItem(config.storageKey);

      if (!rawState) {
        return clone(defaultState);
      }

      const parsedState = normalizeState(JSON.parse(rawState));
      memoryState = clone(parsedState);
      return parsedState;
    } catch (error) {
      return clone(memoryState);
    }
  }

  function writeState(nextState) {
    const normalizedState = normalizeState(nextState);
    memoryState = clone(normalizedState);

    const storage = getStorage();

    if (!storage) {
      return normalizedState;
    }

    try {
      storage.setItem(config.storageKey, JSON.stringify(normalizedState));
    } catch (error) {
      return normalizedState;
    }

    return normalizedState;
  }

  function updateState(updater) {
    const currentState = readState();
    const draft = clone(currentState);
    const nextState = updater(draft) || draft;
    return writeState(nextState);
  }

  function setProfileName(name) {
    const normalizedName = normalizePlayerName(name);

    if (normalizedName.length < config.playerNameMinLength) {
      return {
        ok: false,
        error: `Use at least ${config.playerNameMinLength} characters for the player name.`
      };
    }

    const nextState = updateState((state) => {
      state.profile.name = normalizedName;
      state.profile.updatedAt = new Date().toISOString();
      return state;
    });

    return {
      ok: true,
      profile: nextState.profile
    };
  }

  function setLeaderboardEntries(entries) {
    const nextState = updateState((state) => {
      state.leaderboard = Array.isArray(entries) ? entries.map(normalizeEntry) : [];
      return state;
    });

    return nextState.leaderboard;
  }

  function clearLeaderboard() {
    return updateState((state) => {
      state.leaderboard = [];
      return state;
    }).leaderboard;
  }

  window.GameHub.storage = {
    getState: readState,
    updateState,
    getProfile: () => readState().profile,
    getProfileName: () => readState().profile.name,
    normalizePlayerName,
    setProfileName,
    getLeaderboardEntries: () => readState().leaderboard,
    setLeaderboardEntries,
    clearLeaderboard
  };
})();
