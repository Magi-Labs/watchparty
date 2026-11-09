/* === Huddle — Initialization === */

/* ---------- Auto-Join via URL Hash ---------- */
function checkAutoJoin(invite) {
  if (!invite) return false;
  const { roomCode, name } = invite;
  if (name) saveDisplayName(name);

  const url = new URL(window.location.href);
  const params = new URLSearchParams(url.hash.slice(1));
  if (params.get("huddle_room")?.toUpperCase() === roomCode) {
    params.delete("huddle_room");
    if (name) params.delete("name");
    url.hash = params.toString();
    history.replaceState(history.state, "", url.href);
  }

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
      window.removeEventListener("hashchange", rememberRoomInvite);
      const invite = readRoomInvite(window.location.href) ?? earlyRoomInvite;
      earlyRoomInvite = null;
      if (!checkAutoJoin(invite) && socket.connected) rejoinRoom();
      window.addEventListener("hashchange", (event) => checkAutoJoin(readRoomInvite(event.newURL)));
    });
  });
}

// Wait for DOM to be ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
