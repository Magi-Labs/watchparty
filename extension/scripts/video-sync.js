/* === Huddle — Shared Playback === */

const observedPlayers = new WeakSet();
let roomPlayback = null;
let videoCheckTimer = null;
let playbackPending = false;

function playbackTime() {
  const elapsed = roomPlayback.paused ? 0 : (performance.now() - roomPlayback.receivedAt) / 1000;
  return roomPlayback.time + elapsed;
}

function syncPlayer(threshold) {
  if (!videoPlayer || isAdPlaying() || videoPlayer.readyState === 0) return;
  if (!areUrlsSameVideo(window.location.href, roomVideoUrl)) return;
  playbackPending = false;
  const time = Math.min(playbackTime(), videoPlayer.duration || Infinity);
  if (!videoPlayer.seeking && Math.abs(videoPlayer.currentTime - time) > threshold) {
    videoPlayer.currentTime = time;
  }
  if (roomPlayback.paused && !videoPlayer.paused) videoPlayer.pause();
  if (!roomPlayback.paused && videoPlayer.paused) videoPlayer.play().catch(() => {});
}

function receivePlayback({ time, paused }, type) {
  if (!Number.isFinite(time) || typeof paused !== "boolean") return;
  roomPlayback = { time, paused, receivedAt: performance.now() };
  playbackPending = true;
  syncPlayer(type === "seek" || type === "initial" ? 0.4 : 2);
}

function emitVideoSync(video, type) {
  if (video !== videoPlayer || !roomPlayback || !socket.connected || isAdPlaying()) return;
  if (!areUrlsSameVideo(window.location.href, roomVideoUrl)) return;

  const { currentTime: time, paused } = video;
  // Ignore media events caused by applying the shared state to this player.
  const echoed = type === "seek"
    ? Math.abs(time - Math.min(playbackTime(), video.duration || Infinity)) <= 0.5
    : paused === roomPlayback.paused;
  if (echoed) return;

  roomPlayback = { time, paused, receivedAt: performance.now() };
  socket.emit("videoSync", { roomCode: currentRoomCode, time, paused, type });
}

function detectVideoPlayer() {
  const onRoomVideo = areUrlsSameVideo(window.location.href, roomVideoUrl);
  const video = onRoomVideo && !isAdPlaying() ? document.querySelector("video") : null;
  if (video !== videoPlayer) {
    videoPlayer = video;
    playbackPending = true;
    if (video && !observedPlayers.has(video)) {
      observedPlayers.add(video);
      video.addEventListener("play", () => emitVideoSync(video, "play"));
      video.addEventListener("pause", () => emitVideoSync(video, "pause"));
      video.addEventListener("seeked", () => emitVideoSync(video, "seek"));
    }
  }
  if (playbackPending) syncPlayer(0.4);
}

function startVideoSync(playback) {
  stopVideoSync();
  receivePlayback(playback, "initial");
  detectVideoPlayer();
  videoCheckTimer = setInterval(detectVideoPlayer, 500);
}

function stopVideoSync() {
  clearInterval(videoCheckTimer);
  videoCheckTimer = null;
  videoPlayer = null;
  roomPlayback = null;
  playbackPending = false;
}
