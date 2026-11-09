/* === Huddle — Views === */

/* ---------- UI: Main Page ---------- */
function renderMainView() {
  const page = document.getElementById("huddle-page-main");
  if (!page) return;

  const savedName = localStorage.getItem("huddle_display_name") || "";
  const showFloating =
    localStorage.getItem("huddle_show_floating_btn") !== "false";

  page.innerHTML = `
    <div class="huddle-card">
      <div class="huddle-card-title">👤 Display Name</div>
      <input class="huddle-input" id="huddle-name-input" type="text" 
             placeholder="What should we call you?" maxlength="80" />
    </div>

    <button class="huddle-btn huddle-btn-primary" id="huddle-create-room-btn" style="margin-top: 16px;">
      🎬 Start New Room
    </button>

    <div class="huddle-divider" style="margin: 16px 0;">or join a room</div>

    <div class="huddle-card">
      <div class="huddle-card-title">🔑 Room Code</div>
      <input class="huddle-input" id="huddle-room-input" type="text" 
             placeholder="e.g. HUD-A1B2" style="text-transform: uppercase;" />
      <button class="huddle-btn huddle-btn-secondary huddle-btn-small" 
              id="huddle-join-btn" style="margin-top: 10px;">
        🚪 Join Room
      </button>
    </div>

    <button class="huddle-btn huddle-btn-twitch" id="huddle-twitch-nav-btn" style="margin-top: 16px;">
      🟣 Twitch Integration
    </button>

    <div class="huddle-divider" style="margin: 16px 0;">settings</div>
    <div class="huddle-card" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px;">
      <span style="font-size: 13px; font-weight: 600; color: var(--hud-text-muted);">Show floating 🎬 button</span>
      <label class="huddle-switch">
        <input type="checkbox" id="huddle-toggle-floating" ${showFloating ? "checked" : ""}>
        <span class="huddle-switch-slider"></span>
      </label>
    </div>
  `;

  document.getElementById("huddle-name-input").value = savedName;

  // Event listeners
  document
    .getElementById("huddle-create-room-btn")
    .addEventListener("click", handleCreateRoom);
  document
    .getElementById("huddle-join-btn")
    .addEventListener("click", handleJoinRoom);
  document
    .getElementById("huddle-twitch-nav-btn")
    .addEventListener("click", () => {
      showPage("twitch");
      renderTwitchView();
    });

  // Floating button toggle listener
  document
    .getElementById("huddle-toggle-floating")
    .addEventListener("change", (e) => {
      const isChecked = e.target.checked;
      localStorage.setItem(
        "huddle_show_floating_btn",
        isChecked ? "true" : "false",
      );
      const openBtn = document.getElementById("huddle-open-btn");
      if (openBtn) {
        openBtn.style.display = isChecked ? "block" : "none";
      }
    });
}

/* ---------- UI: Room Page ---------- */
function renderRoomView() {
  const page = document.getElementById("huddle-page-room");
  if (!page) return;

  page.innerHTML = `
    <div class="huddle-room-toolbar">
      <strong id="huddle-room-code-display"></strong>
      <button class="huddle-btn huddle-btn-secondary huddle-btn-small" id="huddle-copy-invite" type="button">Copy invite</button>
      <button class="huddle-btn huddle-btn-small" id="huddle-leave-room-btn" type="button">Leave</button>
    </div>
    <div id="huddle-room-chat" role="log" aria-label="Room chat"></div>
    <form id="huddle-room-chat-form">
      <input class="huddle-input" id="huddle-room-chat-input" aria-label="Chat message"
        placeholder="Type a message" maxlength="300" required>
      <button class="huddle-btn huddle-btn-secondary huddle-btn-small" type="submit">Send</button>
    </form>
  `;

  document.getElementById("huddle-room-code-display").textContent = currentRoomCode;
  document.getElementById("huddle-copy-invite").addEventListener("click", async () => {
    const invite = new URL(roomVideoUrl);
    invite.hash = new URLSearchParams({ huddle_room: currentRoomCode }).toString();
    try {
      await navigator.clipboard.writeText(invite.href);
      showToast("Invite link copied!");
    } catch {
      showToast("Could not copy the invite. Share the room code instead.", "error");
    }
  });
  document.getElementById("huddle-leave-room-btn").addEventListener("click", handleLeaveRoom);
  renderRoomChat();

  const chatForm = document.getElementById("huddle-room-chat-form");
  const chatInput = document.getElementById("huddle-room-chat-input");
  const chatSend = chatForm.querySelector("button");
  chatInput.addEventListener("keydown", (event) => event.stopPropagation());
  chatForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const message = chatInput.value.trim();
    if (!message || chatSend.disabled) return;
    if (!socket.connected) {
      showToast("Reconnect to the room before sending a message.", "warning");
      return;
    }

    chatSend.disabled = true;
    const draft = chatInput.value;
    socket.timeout(5000).emit("roomChat", { roomCode: currentRoomCode, message }, (error, sent) => {
      chatSend.disabled = false;
      if (error || !sent) {
        showToast("Chat message could not be confirmed.", "error");
        return;
      }
      if (chatInput.value === draft) chatInput.value = "";
    });
  });

}

function renderRoomChat() {
  const chat = document.getElementById("huddle-room-chat");
  if (!chat) return;

  const messages = roomChatMessages.map(({ name, message, own }) => {
    const bubble = document.createElement("div");
    bubble.className = own ? "huddle-chat-bubble huddle-chat-own" : "huddle-chat-bubble";
    const sender = document.createElement("strong");
    sender.textContent = name;
    const body = document.createElement("div");
    body.textContent = message;
    bubble.append(sender, body);
    return bubble;
  });
  if (messages.length === 0) {
    const empty = document.createElement("p");
    empty.className = "huddle-chat-empty";
    empty.textContent = "No messages yet.";
    messages.push(empty);
  }
  chat.replaceChildren(...messages);
  chat.scrollTop = chat.scrollHeight;
}

/* ---------- UI: Twitch Page ---------- */
function renderTwitchView() {
  const page = document.getElementById("huddle-page-twitch");
  if (!page) return;

  let html = `
    <button class="huddle-back-btn" id="huddle-twitch-back">
      ← Back to ${currentRoomCode ? "Room" : "Menu"}
    </button>

    <div style="text-align: center; margin-bottom: 8px;">
      <span style="font-size: 28px;">🟣</span>
      <div style="font-size: 18px; font-weight: 700; margin-top: 4px;">Twitch Integration</div>
    </div>
  `;

  if (!isConnectedToTwitch) {
    // Not connected
    html += `
      <div class="huddle-empty">
        <span class="huddle-empty-icon">🔗</span>
        <span class="huddle-empty-text">Connect your Twitch account to share clips with your viewers</span>
      </div>
      <button class="huddle-btn huddle-btn-twitch" id="huddle-twitch-connect">
        🟣 Connect Twitch
      </button>
    `;
  } else {
    // Connected
    html += `
      <div class="huddle-twitch-status connected">
        🟢 Connected as <strong>${twitchUserInfo?.display_name || "Unknown"}</strong>
      </div>
    `;

    // Live status
    if (twitchLiveStatus) {
      html += `
        <div class="huddle-twitch-status live">
          <span class="huddle-live-dot"></span>
          LIVE — ${twitchLiveStatus.viewer_count || 0} viewers
        </div>
      `;
    } else {
      html += `
        <div class="huddle-twitch-status offline">
          ⚫ Offline — Go live to share clips
        </div>
      `;
    }

    // Refresh status button
    html += `
      <button class="huddle-btn huddle-btn-secondary huddle-btn-small" id="huddle-twitch-refresh">
        🔄 Refresh Status
      </button>
    `;

    // Disconnect button
    html += `
      <button class="huddle-btn huddle-btn-secondary huddle-btn-small" id="huddle-twitch-disconnect" style="margin-top: 8px;">
        🔌 Disconnect Twitch
      </button>
    `;
  }

  page.innerHTML = html;

  // Event listeners
  document
    .getElementById("huddle-twitch-back")
    ?.addEventListener("click", () => {
      showPage(currentRoomCode ? "room" : "main");
      if (currentRoomCode) renderRoomView();
      else renderMainView();
    });

  document
    .getElementById("huddle-twitch-connect")
    ?.addEventListener("click", startTwitchOAuth);
  document
    .getElementById("huddle-twitch-refresh")
    ?.addEventListener("click", checkTwitchLiveStatus);

  document
    .getElementById("huddle-twitch-disconnect")
    ?.addEventListener("click", () => {
      twitchAccessToken = null;
      twitchUserInfo = null;
      twitchLiveStatus = null;
      isConnectedToTwitch = false;
      try {
        if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
          chrome.storage.local.remove("huddle_twitch_token");
        }
      } catch (err) {
        handleInvalidatedContext(err);
      }
      renderTwitchView();
      showToast("Twitch disconnected", "info");
    });
}

/* ---------- UI: Handlers ---------- */
function handleCreateRoom() {
  const nameInput = document.getElementById("huddle-name-input");
  if (!nameInput || !nameInput.value.trim()) {
    showToast("Please enter your display name!", "warning");
    return;
  }

  const meta = getVideoMetadata();
  if (meta.source === "unknown") {
    showToast(
      "Open a video on a supported streaming site to start a room.",
      "error",
    );
    return;
  }

  // Also verify that we are on a valid video watch page (not homepages or search pages)
  const url = window.location.href;
  let isValidVideoPage = false;
  if (url.includes("youtube.com/watch")) isValidVideoPage = true;
  else if (url.includes("netflix.com/watch")) isValidVideoPage = true;
  else if (url.includes("clips.twitch.tv")) isValidVideoPage = true;
  else if (url.includes("twitch.tv/videos")) isValidVideoPage = true;
  else if (url.includes("hotstar.com") || url.includes("disneyplus.com"))
    isValidVideoPage = true;
  else if (url.includes("primevideo.com")) isValidVideoPage = true;
  else if (document.querySelector("video")) isValidVideoPage = true; // Fallback if a video tag is already present

  if (!isValidVideoPage) {
    showToast(
      "Open a video before starting a room.",
      "error",
    );
    return;
  }

  displayName = nameInput.value.trim();
  saveDisplayName(displayName);

  const video = isAdPlaying() ? null : document.querySelector("video");
  socket.emit("createRoom", {
    name: displayName,
    videoUrl: meta.videoUrl,
    videoTitle: meta.videoTitle,
    videoThumbnail: meta.videoThumbnail,
    videoDuration: video?.duration ?? 0,
    source: meta.source,
    time: video?.currentTime ?? 0,
    paused: video?.paused ?? true,
  });
}

function handleJoinRoom() {
  const nameInput = document.getElementById("huddle-name-input");
  const roomInput = document.getElementById("huddle-room-input");

  if (!nameInput || !nameInput.value.trim()) {
    showToast("Please enter your display name!", "warning");
    return;
  }
  if (!roomInput || !roomInput.value.trim()) {
    showToast("Please enter a room code!", "warning");
    return;
  }

  displayName = nameInput.value.trim();
  saveDisplayName(displayName);

  const roomCode = roomInput.value.trim().toUpperCase();
  socket.emit("joinRoom", { roomCode, name: displayName });
}

function exitRoom() {
  clearRoomSession();
  stopVideoSync();
  showPage("main");
  renderMainView();
  applyDynamicTheme(getVideoMetadata().source);
}

function handleLeaveRoom() {
  if (socket.connected) socket.emit("leaveRoom");
  exitRoom();
  showToast("Left the room", "info");
}
