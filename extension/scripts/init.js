/* === Huddle — Initialization === */

/* ---------- Auto-Join via URL Hash ---------- */
function checkAutoJoin() {
  const params = new URLSearchParams(window.location.hash.slice(1));
  const roomCode = params.get("huddle_room")?.toUpperCase();
  if (!/^HUD-[A-Z0-9]{4}$/.test(roomCode ?? "")) return false;

  const name = params.get("name");
  if (name) saveDisplayName(name);
  history.replaceState(null, "", window.location.pathname + window.location.search);
  pendingInviteCode = roomCode;
  if (socket.connected) rejoinRoom();
  return true;
}

/* ---------- Extension Detection Marker ---------- */
function injectExtensionMarker() {
  const marker = document.createElement("div");
  marker.id = "huddle-ext-installed";
  marker.style.display = "none";
  marker.setAttribute("data-version", "2.0.0");
  document.documentElement.appendChild(marker);

  // Also respond to postMessage queries from Landing Page
  window.addEventListener("message", (event) => {
    if (event.data && event.data.type === "HUDDLE_EXT_CHECK") {
      window.postMessage({ type: "HUDDLE_EXT_PRESENT", version: "2.0.0" }, "*");
    }
  });
}

/* ---------- Initialize ---------- */
function init() {
  injectExtensionMarker();
  restoreTwitchToken();

  // Clear legacy global room keys to prevent conflicts with tab-isolated storage
  try {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.remove(["huddle_room_code", "huddle_is_host"]);
    }
  } catch (err) {
    console.warn("[Huddle] Failed to clear legacy storage keys on init:", err);
  }

  loadDisplayName(() => {
    restoreRoomSession(() => {
      buildSidebar();
      if (!checkAutoJoin() && socket.connected) rejoinRoom();
      window.addEventListener("hashchange", checkAutoJoin);
    });
  });
}

// Wait for DOM to be ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
