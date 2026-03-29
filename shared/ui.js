window.GameHub = window.GameHub || {};

(() => {
  const { config } = window.GameHub;

  if (!config) {
    return;
  }

  function clearChildren(element) {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }

  function getInitials(name) {
    const normalized = String(name || "").trim();

    if (!normalized) {
      return "GH";
    }

    return normalized
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  }

  function setText(element, value) {
    if (element) {
      element.textContent = value;
    }
  }

  function formatGameName(gameId) {
    const game = config.games.find((entry) => entry.id === gameId);
    return game ? game.name : "Unknown game";
  }

  function formatDateTime(value) {
    if (!value) {
      return "No activity yet";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "No activity yet";
    }

    return date.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  }

  function renderEmptyState(container, title, description, colspan = 1) {
    clearChildren(container);

    if (container.tagName === "TBODY") {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      const state = document.createElement("div");
      const heading = document.createElement("h3");
      const copy = document.createElement("p");

      cell.colSpan = colspan;
      state.className = "empty-state";
      heading.textContent = title;
      copy.textContent = description;
      state.append(heading, copy);
      cell.appendChild(state);
      row.appendChild(cell);
      container.appendChild(row);
      return;
    }

    const state = document.createElement("div");
    const heading = document.createElement("h3");
    const copy = document.createElement("p");

    state.className = "empty-state";
    heading.textContent = title;
    copy.textContent = description;
    state.append(heading, copy);
    container.appendChild(state);
  }

  function renderLeaderboardRows(container, entries, { variant = "full" } = {}) {
    if (!container) {
      return;
    }

    if (!entries.length) {
      renderEmptyState(container, "No scores yet", "Finish a game to add scores to the leaderboard.", variant === "compact" ? 5 : 6);
      return;
    }

    clearChildren(container);
    const fragment = document.createDocumentFragment();

    entries.forEach((entry, index) => {
      const row = document.createElement("tr");
      const rankCell = document.createElement("td");
      const playerCell = document.createElement("td");
      const gameCell = document.createElement("td");
      const scoreCell = document.createElement("td");
      const resultCell = document.createElement("td");

      rankCell.innerHTML = `<span class="rank-pill">#${index + 1}</span>`;

      const playerName = document.createElement("span");
      playerName.className = "table-player";
      playerName.textContent = entry.playerName;
      playerCell.appendChild(playerName);

      gameCell.textContent = formatGameName(entry.gameId);
      scoreCell.textContent = String(entry.score);

      const resultTitle = document.createElement("span");
      resultTitle.textContent = entry.result;
      resultCell.appendChild(resultTitle);

      if (entry.detail) {
        const detail = document.createElement("span");
        detail.className = "table-detail";
        detail.textContent = entry.detail;
        resultCell.appendChild(detail);
      }

      row.append(rankCell, playerCell, gameCell, scoreCell, resultCell);

      if (variant === "full") {
        const dateCell = document.createElement("td");
        dateCell.textContent = formatDateTime(entry.playedAt);
        row.appendChild(dateCell);
      }

      fragment.appendChild(row);
    });

    container.appendChild(fragment);
  }

  function ensureToastStack() {
    let stack = document.querySelector(".toast-stack");

    if (!stack) {
      stack = document.createElement("div");
      stack.className = "toast-stack";
      document.body.appendChild(stack);
    }

    return stack;
  }

  function showToast(message, tone = "success") {
    const stack = ensureToastStack();
    const toast = document.createElement("div");

    toast.className = "toast";
    toast.dataset.tone = tone;
    toast.textContent = message;

    stack.appendChild(toast);

    window.setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  function initializePage() {
    window.requestAnimationFrame(() => {
      document.body.classList.add("is-ready");
    });
  }

  window.GameHub.ui = {
    clearChildren,
    getInitials,
    setText,
    formatGameName,
    formatDateTime,
    renderEmptyState,
    renderLeaderboardRows,
    showToast,
    initializePage
  };
})();
