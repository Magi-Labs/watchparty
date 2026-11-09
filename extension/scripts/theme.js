/* === Huddle — Theme === */

/* ---------- UI Theme Management Helpers ---------- */
function addThemeToggle(sidebar, header) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "huddle-theme-btn";
  button.setAttribute("aria-label", "Dark mode");
  button.disabled = true;

  function applyDarkMode(dark) {
    sidebar.classList.toggle("huddle-dark", dark);
    button.setAttribute("aria-pressed", dark);
    button.textContent = dark ? "☀" : "☾";
    button.title = dark ? "Switch to light mode" : "Switch to dark mode";
  }

  applyDarkMode(false);
  chrome.storage.local.get({ huddle_dark_mode: false }, ({ huddle_dark_mode }) => {
    applyDarkMode(huddle_dark_mode === true);
    button.disabled = false;
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.huddle_dark_mode) {
      applyDarkMode(changes.huddle_dark_mode.newValue === true);
    }
  });
  button.addEventListener("click", () => {
    const dark = !sidebar.classList.contains("huddle-dark");
    applyDarkMode(dark);
    chrome.storage.local.set({ huddle_dark_mode: dark });
  });
  header.appendChild(button);
}

function applyDynamicTheme(sourcePlatform) {
  const sidebar = document.getElementById("huddle-sidebar");
  if (!sidebar) return;

  // Elegant pastel palettes matching each platform
  const themes = {
    YouTube: {
      primary: "#f43f5e", // Soft Coral Red
      "primary-light": "#fb7185", // Light Coral
      secondary: "#06b6d4", // Soft Cyan
      "bg-cream": "#fff5f5", // Ultra soft red tint
    },
    "Twitch Clip": {
      primary: "#8b5cf6", // Soft Twitch Purple
      "primary-light": "#a78bfa", // Light Purple
      secondary: "#06b6d4", // Soft Cyan
      "bg-cream": "#f8f6ff", // Ultra soft purple tint
    },
    Netflix: {
      primary: "#e11d48", // Soft Netflix Crimson
      "primary-light": "#fb7185", // Light Crimson
      secondary: "#10b981", // Soft Green
      "bg-cream": "#fff5f5", // Ultra soft red tint
    },
    "Disney+ Hotstar": {
      primary: "#1d4ed8", // Deep Royal Blue
      "primary-light": "#60a5fa", // Light Royal Blue
      secondary: "#f43f5e", // Soft Pink/Red
      "bg-cream": "#f0f4ff", // Ultra soft blue tint
    },
    "Prime Video": {
      primary: "#0284c7", // Sky Prime Blue
      "primary-light": "#38bdf8", // Light Prime Blue
      secondary: "#f59e0b", // Soft Amber/Yellow
      "bg-cream": "#f0f9ff", // Ultra soft cyan tint
    },
    Default: {
      primary: "#8b5cf6", // Pastel Violet
      "primary-light": "#a78bfa", // Light Violet
      secondary: "#06b6d4", // Soft Cyan
      "bg-cream": "#fff8f0", // Pastel Peach/Cream
    },
  };

  const theme = themes[sourcePlatform] || themes["Default"];

  // Set the CSS variables dynamically on the sidebar container
  sidebar.style.setProperty("--hud-primary", theme["primary"]);
  sidebar.style.setProperty("--hud-primary-light", theme["primary-light"]);
  sidebar.style.setProperty("--hud-secondary", theme["secondary"]);
  sidebar.style.setProperty("--hud-platform-bg", theme["bg-cream"]);

  // Update floating button variables as well
  const openBtn = document.getElementById("huddle-open-btn");
  if (openBtn) {
    openBtn.style.setProperty("--hud-primary", theme["primary"]);
    openBtn.style.setProperty("--hud-primary-light", theme["primary-light"]);
  }
}
