/* Shared light/dark theme preference for the app shell. */
(function () {
  const STORAGE_KEY = "bnh_theme";
  const root = document.documentElement;

  function getTheme() {
    return localStorage.getItem(STORAGE_KEY) === "dark" ? "dark" : "light";
  }

  function applyTheme(theme) {
    const activeTheme = theme === "dark" ? "dark" : "light";
    root.dataset.theme = activeTheme;
    document.querySelectorAll("[data-theme-toggle]").forEach(button => {
      const dark = activeTheme === "dark";
      button.textContent = dark ? "☀️ Light" : "🌙 Dark";
      button.setAttribute("aria-pressed", String(dark));
      button.setAttribute("aria-label", `Switch to ${dark ? "light" : "dark"} mode`);
    });
  }

  applyTheme(getTheme());

  window.BNH_THEME = {
    toggle() {
      const nextTheme = getTheme() === "dark" ? "light" : "dark";
      localStorage.setItem(STORAGE_KEY, nextTheme);
      applyTheme(nextTheme);
    }
  };
})();
