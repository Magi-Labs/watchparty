function readRoomInvite(url) {
  const params = new URLSearchParams(new URL(url).hash.slice(1));
  const roomCode = params.get("huddle_room")?.toUpperCase();
  if (!/^HUD-[A-Z0-9]{4}$/.test(roomCode ?? "")) return null;
  return { roomCode, name: params.get("name") };
}

// Streaming pages may rewrite their URL before the room UI loads.
let earlyRoomInvite = readRoomInvite(window.location.href);
function rememberRoomInvite(event) {
  earlyRoomInvite = readRoomInvite(event.newURL) ?? earlyRoomInvite;
}
window.addEventListener("hashchange", rememberRoomInvite);
