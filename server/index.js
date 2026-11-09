// ============================================================================
// Huddle Sync Server
// Real-time video synchronization server using Socket.IO
// ============================================================================

const express = require("express");
const http = require("http");
const { randomUUID, timingSafeEqual } = require("node:crypto");

const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 4000;
const accessKey = Buffer.from(process.env.WATCHPARTY_ACCESS_KEY || "");

if (process.env.NODE_ENV === "production" && accessKey.length === 0) {
  throw new Error("WATCHPARTY_ACCESS_KEY is required in production");
}

io.use(function (socket, next) {
  if (accessKey.length === 0) return next();

  const candidate = socket.handshake.auth?.accessKey;
  const supplied = Buffer.from(typeof candidate === "string" ? candidate : "");
  if (supplied.length !== accessKey.length || !timingSafeEqual(supplied, accessKey)) {
    return next(new Error("Invalid watch party access key"));
  }
  next();
});

// ============================================================================
// Room Registry
// In-memory store: roomCode -> Room object
// ============================================================================

const rooms = new Map();
const streamingHosts = new Set([
  "www.youtube.com", "www.netflix.com", "www.primevideo.com", "clips.twitch.tv", "hotstar.com",
]);

/**
 * Generate a random room code in the format "HUD-XXXX".
 * Uses alphanumeric characters (uppercase + digits).
 * Retries if the code already exists (extremely unlikely collision).
 */
function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // removed ambiguous: I,1,O,0
  let code;
  do {
    let suffix = "";
    for (let i = 0; i < 4; i++) {
      suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    code = "HUD-" + suffix;
  } while (rooms.has(code));
  return code;
}

const EMPTY_ROOM_TIMEOUT = 30_000;
const quickReactions = new Set(["❤️", "👍", "😂", "👏", "🎉", "😮", "😢", "🔥"]);
const ROOM_MESSAGE_LIMIT = 100;
const playbackActions = new Map([
  ["play", "resumed at"],
  ["pause", "paused at"],
  ["seek", "jumped to"],
]);

function formatPlaybackTime(time) {
  const seconds = Math.floor(time);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor(seconds / 60) % 60;
  const remainder = String(seconds % 60).padStart(2, "0");
  return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${remainder}` : `${minutes}:${remainder}`;
}

function getPlayback(room) {
  const elapsed = room.paused ? 0 : (Date.now() - room.updatedAt) / 1000;
  return { time: room.time + elapsed, paused: room.paused };
}

function getRoomMeta(room, roomCode) {
  return {
    ...room.video,
    ...getPlayback(room),
    roomCode,
    viewerCount: room.members.size,
    viewers: [...room.members.values()],
  };
}

function leaveRoom(socket) {
  const { roomCode } = socket.data;
  const room = rooms.get(roomCode);
  if (!room) return;

  socket.leave(roomCode);
  delete socket.data.roomCode;
  room.members.delete(socket.id);
  if (room.members.size === 0) {
    room.time = getPlayback(room).time;
    room.paused = true;
    room.emptyTimer = setTimeout(() => rooms.delete(roomCode), EMPTY_ROOM_TIMEOUT);
  }
}

function enterRoom(socket, roomCode, room, name) {
  if (socket.data.roomCode !== roomCode) leaveRoom(socket);
  clearTimeout(room.emptyTimer);
  room.emptyTimer = null;
  socket.join(roomCode);
  socket.data.roomCode = roomCode;
  room.members.set(socket.id, typeof name === "string" ? name.trim().slice(0, 80) || "Viewer" : "Viewer");
}

// ============================================================================
// HTTP Routes
// ============================================================================

// CORS middleware for HTTP routes
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept",
  );
  next();
});

// Health-check / landing
app.get("/", function (req, res) {
  res.json({
    name: "Huddle Sync Server",
    status: "running",
    activeRooms: rooms.size,
  });
});

/**
 * GET /api/room/:code
 * Returns room metadata as JSON.
 * Used by the Landing Page to look up a room before joining.
 */
app.get("/api/room/:code", function (req, res) {
  // The private deployment uses the extension for room discovery.
  if (accessKey.length > 0) return res.sendStatus(404);

  var code = req.params.code.toUpperCase();
  var room = rooms.get(code);

  if (!room) {
    return res.status(404).json({ error: "Room not found", roomCode: code });
  }

  res.json(getRoomMeta(room, code));
});

// ============================================================================
// Socket.IO – Connection Handling
// ============================================================================

io.on("connection", (socket) => {
  socket.emit("whoami", { id: socket.id });

  socket.on("createRoom", (data) => {
    if (typeof data?.videoUrl !== "string") return;
    let videoUrl;
    try {
      videoUrl = new URL(data.videoUrl);
    } catch {
      return;
    }
    if (videoUrl.protocol !== "https:" || videoUrl.port || videoUrl.username || videoUrl.password ||
        (!streamingHosts.has(videoUrl.hostname) && !videoUrl.hostname.endsWith(".hotstar.com"))) return;
    videoUrl.hash = "";

    const roomCode = generateRoomCode();
    const room = {
      video: {
        videoUrl: videoUrl.href,
        videoTitle: typeof data.videoTitle === "string" ? data.videoTitle.slice(0, 300) : "",
        videoThumbnail: typeof data.videoThumbnail === "string" ? data.videoThumbnail : "",
        videoDuration: Number.isFinite(data.videoDuration) ? data.videoDuration : 0,
        source: typeof data.source === "string" ? data.source.slice(0, 80) : "",
      },
      time: Number.isFinite(data.time) && data.time >= 0 ? data.time : 0,
      paused: data.paused !== false,
      updatedAt: Date.now(),
      members: new Map(),
      messages: new Map(),
      emptyTimer: null,
    };
    rooms.set(roomCode, room);
    enterRoom(socket, roomCode, room, data.name ?? data.hostName);
    socket.emit("roomCreated", getRoomMeta(room, roomCode));
  });

  socket.on("joinRoom", (data) => {
    const roomCode = typeof data?.roomCode === "string" ? data.roomCode.toUpperCase() : "";
    const room = rooms.get(roomCode);
    if (!room) {
      socket.emit("joinError", { roomCode, message: "This room has expired or does not exist." });
      return;
    }
    enterRoom(socket, roomCode, room, data.name);
    socket.emit("joinSuccess", getRoomMeta(room, roomCode));
  });

  socket.on("leaveRoom", () => leaveRoom(socket));
  socket.on("disconnect", () => leaveRoom(socket));

  socket.on("roomChat", (data, acknowledge) => {
    if (typeof acknowledge !== "function") return;
    const { roomCode } = socket.data;
    const room = rooms.get(roomCode);
    const message = typeof data?.message === "string" ? data.message.trim() : "";
    if (!room?.members.has(socket.id) || data?.roomCode !== roomCode || !message || message.length > 300) {
      return acknowledge(false);
    }

    const reply = room.messages.get(data.replyTo);
    if (data.replyTo != null && !reply) return acknowledge(false);

    const entry = {
      roomCode,
      id: randomUUID(),
      senderId: socket.id,
      name: room.members.get(socket.id),
      message,
      reply: reply ? { name: reply.name, message: reply.message } : null,
    };
    room.messages.set(entry.id, entry);
    if (room.messages.size > ROOM_MESSAGE_LIMIT) {
      room.messages.delete(room.messages.keys().next().value);
    }
    io.to(roomCode).emit("roomChat", entry);
    acknowledge(true);
  });

  socket.on("roomReaction", (data, acknowledge) => {
    if (typeof acknowledge !== "function") return;
    const { roomCode } = socket.data;
    const room = rooms.get(roomCode);
    const now = Date.now();
    if (!room?.members.has(socket.id) || data?.roomCode !== roomCode || !quickReactions.has(data.emoji) ||
        now - (socket.data.lastReaction ?? 0) < 300) return acknowledge(false);

    socket.data.lastReaction = now;
    io.to(roomCode).emit("roomReaction", { roomCode, emoji: data.emoji, name: room.members.get(socket.id) });
    acknowledge(true);
  });

  socket.on("videoSync", (data) => {
    const { roomCode } = socket.data;
    const room = rooms.get(roomCode);
    if (!room?.members.has(socket.id) || data?.roomCode !== roomCode) return;
    const { time, paused, type } = data;
    if (!Number.isFinite(time) || time < 0 || typeof paused !== "boolean") return;
    const action = playbackActions.get(type);
    if (!action) return;

    room.time = time;
    room.paused = paused;
    room.updatedAt = Date.now();
    socket.to(roomCode).emit("videoSync", { roomCode, time, paused, type });
    const position = formatPlaybackTime(time);
    const participant = room.members.get(socket.id);
    io.to(roomCode).emit("roomChat", {
      roomCode,
      name: "Huddle",
      message: `${participant} ${action} ${position}`,
      activity: true,
    });
  });
});

// Drift correction uses the same timeline for everyone, regardless of who last used the player.
setInterval(() => {
  for (const [roomCode, room] of rooms) {
    if (room.members.size > 1) {
      io.to(roomCode).emit("videoSync", { roomCode, ...getPlayback(room), type: "heartbeat" });
    }
  }
}, 5000).unref();

// ============================================================================
// Start Server
// ============================================================================

server.listen(PORT, function () {
  console.log("");
  console.log("  🟢  Huddle Sync Server is running");
  console.log("  📡  Port: %d", PORT);
  console.log("  🕐  Started at: %s", new Date().toISOString());
  console.log("");
});
