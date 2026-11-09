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
      <span style="font-size: 13px; font-weight: 600; color: var(--hud-text-muted);">Show floating tab</span>
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
      <button class="huddle-btn huddle-btn-secondary huddle-btn-small" id="huddle-copy-invite"
        type="button" aria-label="Copy invite link" title="Copy invite link">
        <!-- Lucide link icon. See vendor/LUCIDE-LICENSE.txt. -->
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      </button>
      <button class="huddle-btn huddle-btn-secondary huddle-btn-small" id="huddle-leave-room-btn"
        type="button" aria-label="Leave room" title="Leave room">
        <!-- Lucide log-out icon. See vendor/LUCIDE-LICENSE.txt. -->
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="m16 17 5-5-5-5" />
          <path d="M21 12H9" />
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        </svg>
      </button>
    </div>
    <div class="huddle-emoji-grid" id="huddle-reactions" role="group" aria-label="Quick reactions"></div>
    <input class="huddle-input" id="huddle-invite-url" aria-label="Invite link" readonly hidden>
    <div id="huddle-room-chat" role="log" aria-label="Room chat"></div>
    <div id="huddle-reply-preview" hidden>
      <div class="huddle-reply-quote"><strong></strong><span></span></div>
      <button class="huddle-reply-button" id="huddle-cancel-reply" type="button" aria-label="Cancel reply">✕</button>
    </div>
    <form id="huddle-room-chat-form">
      <button class="huddle-btn huddle-btn-secondary huddle-btn-small" id="huddle-emoji-button"
        type="button" aria-label="Choose emoji" title="Choose emoji" aria-haspopup="dialog">☺</button>
      <input class="huddle-input" id="huddle-room-chat-input" aria-label="Chat message"
        placeholder="Type a message" maxlength="300" required>
      <button class="huddle-btn huddle-btn-secondary huddle-btn-small" id="huddle-chat-send"
        type="submit" aria-label="Send" title="Send message">
        <!-- Lucide send icon. See vendor/LUCIDE-LICENSE.txt. -->
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" />
          <path d="m21.854 2.147-10.94 10.939" />
        </svg>
      </button>
    </form>
    <dialog id="huddle-emoji-picker" aria-labelledby="huddle-emoji-title">
      <div class="huddle-emoji-header">
        <strong id="huddle-emoji-title">Emoji</strong>
        <form method="dialog"><button class="huddle-reply-button" aria-label="Close emoji picker">✕</button></form>
      </div>
      <input class="huddle-input" id="huddle-emoji-search" type="search" aria-label="Search emojis" placeholder="Search emojis">
      <div id="huddle-emoji-results"></div>
    </dialog>
  `;

  document.getElementById("huddle-room-code-display").textContent = currentRoomCode;
  const inviteButton = document.getElementById("huddle-copy-invite");
  const inviteInput = document.getElementById("huddle-invite-url");
  inviteButton.addEventListener("click", async () => {
    const invite = new URL(roomVideoUrl);
    invite.hash = new URLSearchParams({ huddle_room: currentRoomCode }).toString();
    let copied = false;
    try {
      await navigator.clipboard.writeText(invite.href);
      copied = true;
    } catch {
      inviteInput.value = invite.href;
      inviteInput.hidden = false;
      inviteInput.focus();
      inviteInput.select();
      try {
        copied = document.execCommand("copy");
      } catch {
        // Leave the link selected for manual copying.
      }
    }

    if (copied) {
      inviteInput.hidden = true;
      inviteButton.focus();
      showToast("Invite link copied!");
    } else {
      showToast("Press Ctrl+C or ⌘C to copy the selected invite link.", "info");
    }
  });
  document.getElementById("huddle-leave-room-btn").addEventListener("click", handleLeaveRoom);
  renderRoomChat();

  const chatForm = document.getElementById("huddle-room-chat-form");
  const chatInput = document.getElementById("huddle-room-chat-input");
  const chatSend = chatForm.querySelector('[type="submit"]');
  setupRoomEmoji(chatInput);
  renderReplyPreview();
  document.getElementById("huddle-cancel-reply").addEventListener("click", () => {
    roomChatReply = null;
    renderReplyPreview();
    chatInput.focus();
  });
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
    const reply = roomChatReply;
    socket.timeout(5000).emit("roomChat", { roomCode: currentRoomCode, message, replyTo: reply?.id }, (error, sent) => {
      chatSend.disabled = false;
      if (error || !sent) {
        showToast(reply ? "Could not send the reply. Try clearing the quoted message." : "Chat message could not be confirmed.", "error");
        return;
      }
      if (chatInput.value === draft) chatInput.value = "";
      if (roomChatReply === reply) {
        roomChatReply = null;
        renderReplyPreview();
      }
    });
  });

}

function renderReplyPreview() {
  const preview = document.getElementById("huddle-reply-preview");
  preview.hidden = !roomChatReply;
  if (roomChatReply) {
    preview.querySelector("strong").textContent = `Replying to ${roomChatReply.name}`;
    preview.querySelector("span").textContent = roomChatReply.message;
  }
}

function renderRoomChat() {
  const chat = document.getElementById("huddle-room-chat");
  if (!chat) return;

  const messages = roomChatMessages.map(({ id, name, message, own, activity, reply }) => {
    if (activity) {
      const line = document.createElement("div");
      line.className = "huddle-chat-activity";
      line.textContent = message;
      return line;
    }

    const bubble = document.createElement("div");
    bubble.className = own ? "huddle-chat-bubble huddle-chat-own" : "huddle-chat-bubble";
    const header = document.createElement("div");
    header.className = "huddle-chat-message-header";
    const sender = document.createElement("strong");
    sender.textContent = name;
    header.append(sender);
    if (id) {
      const replyButton = document.createElement("button");
      replyButton.type = "button";
      replyButton.className = "huddle-reply-button";
      replyButton.setAttribute("aria-label", `Reply to ${name}`);
      replyButton.title = "Reply";
      replyButton.textContent = "↩";
      replyButton.addEventListener("click", () => {
        roomChatReply = { id, name, message };
        renderReplyPreview();
        document.getElementById("huddle-room-chat-input").focus();
      });
      header.append(replyButton);
    }
    bubble.append(header);
    if (reply) {
      const quote = document.createElement("blockquote");
      quote.className = "huddle-reply-quote";
      const quotedName = document.createElement("strong");
      quotedName.textContent = reply.name;
      const quotedText = document.createElement("span");
      quotedText.textContent = reply.message;
      quote.append(quotedName, quotedText);
      bubble.append(quote);
    }
    const body = document.createElement("div");
    body.textContent = message;
    bubble.append(body);
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
