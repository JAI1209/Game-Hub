window.GameHub = window.GameHub || {};

(() => {
  function format(seconds) {
    const total = Math.max(0, Math.floor(Number(seconds) || 0));
    const minutes = String(Math.floor(total / 60)).padStart(2, "0");
    const remainingSeconds = String(total % 60).padStart(2, "0");
    return `${minutes}:${remainingSeconds}`;
  }

  function createTimer({ onTick } = {}) {
    let seconds = 0;
    let intervalId = null;

    function emit() {
      if (typeof onTick === "function") {
        onTick(seconds);
      }
    }

    return {
      start() {
        if (intervalId !== null) {
          return;
        }

        intervalId = window.setInterval(() => {
          seconds += 1;
          emit();
        }, 1000);
      },
      pause() {
        if (intervalId === null) {
          return;
        }

        window.clearInterval(intervalId);
        intervalId = null;
      },
      reset(nextSeconds = 0) {
        seconds = Math.max(0, Math.floor(Number(nextSeconds) || 0));
        emit();
      },
      stop(nextSeconds = 0) {
        this.pause();
        this.reset(nextSeconds);
      },
      isRunning() {
        return intervalId !== null;
      },
      getSeconds() {
        return seconds;
      }
    };
  }

  window.GameHub.timer = {
    createTimer,
    format
  };
})();
