/* === Huddle — Socket === */

/* ---------- Socket Connection ---------- */
const socket = io(HUDDLE_CONFIG.syncServerUrl, {
  auth: { accessKey: HUDDLE_CONFIG.accessKey },
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});

socket.on("connect_error", (error) => {
  if (error.message === "Invalid watch party access key") {
    showToast("Install the configured private Watch Party extension.", "error");
  }
});

/* ---------- Socket: Connection Events ---------- */
socket.on("whoami", ({ id }) => {
  mySocketId = id;
});

function rejoinRoom() {
  const roomCode = pendingInviteCode ?? currentRoomCode;
  pendingInviteCode = null;
  if (roomCode) socket.emit("joinRoom", { roomCode, name: displayName || "Viewer" });
}

socket.on("connect", rejoinRoom);
socket.on("disconnect", () => {
  mySocketId = null;
  if (currentRoomCode) showToast("Connection lost. Reconnecting…", "warning");
});
socket.io.on("reconnect_failed", () => {
  if (currentRoomCode) showToast("Could not reconnect. Please refresh this page.", "error");
});

function openRoom({ roomCode, videoUrl, source, time, paused }) {
  saveRoomSession(roomCode);
  roomVideoUrl = videoUrl;
  showPage("room");
  renderRoomView();
  openSidebar();
  applyDynamicTheme(source);
  startVideoSync({ time, paused });
}

socket.on("roomCreated", openRoom);
socket.on("joinSuccess", (room) => {
  if (!areUrlsSameVideo(window.location.href, room.videoUrl)) {
    const target = new URL(room.videoUrl);
    target.hash = new URLSearchParams({ huddle_room: room.roomCode }).toString();
    saveRoomSession(room.roomCode);
    window.location.assign(target.href);
    return;
  }
  openRoom(room);
});

socket.on("joinError", ({ roomCode, message }) => {
  if (roomCode === currentRoomCode) exitRoom();
  if (roomCode && !currentRoomCode) {
    document.getElementById("huddle-room-input").value = roomCode;
    openSidebar();
  }
  showToast(message, "error");
});

socket.on("roomChat", ({ roomCode, id, senderId, name, message, activity, reply }) => {
  if (roomCode !== currentRoomCode) return;
  roomChatMessages.push({ id, name, message, activity, reply, own: senderId === mySocketId });
  if (roomChatMessages.length > 50) roomChatMessages.shift();
  renderRoomChat();
});

socket.on("roomReaction", ({ roomCode, name, emoji }) => {
  if (roomCode === currentRoomCode) showRoomReaction(name, emoji);
});

socket.on("videoSync", ({ roomCode, time, paused, type }) => {
  if (roomCode === currentRoomCode) receivePlayback({ time, paused }, type);
});
