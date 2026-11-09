/* === Huddle — Twitch === */

/* ---------- Twitch OAuth ---------- */
function startTwitchOAuth() {
  const scopes = "user:read:email chat:write moderator:read:chatters";
  const authUrl =
    `https://id.twitch.tv/oauth2/authorize` +
    `?client_id=${HUDDLE_CONFIG.twitchClientId}` +
    `&redirect_uri=${encodeURIComponent(HUDDLE_CONFIG.twitchRedirectUri)}` +
    `&response_type=token` +
    `&scope=${encodeURIComponent(scopes)}`;

  // Open OAuth popup
  const popup = window.open(
    authUrl,
    "Huddle Twitch Login",
    "width=500,height=700",
  );

  // Listen for token from popup
  window.addEventListener("message", function handler(event) {
    if (event.data && event.data.type === "HUDDLE_TWITCH_TOKEN") {
      twitchAccessToken = event.data.accessToken;
      try {
        if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({ huddle_twitch_token: twitchAccessToken });
        }
      } catch (err) {
        handleInvalidatedContext(err);
      }
      fetchTwitchUserInfo();
      window.removeEventListener("message", handler);
      if (popup && !popup.closed) popup.close();
    }
  });
}

async function fetchTwitchUserInfo() {
  if (!twitchAccessToken) return;

  try {
    const res = await fetch("https://api.twitch.tv/helix/users", {
      headers: {
        Authorization: `Bearer ${twitchAccessToken}`,
        "Client-Id": HUDDLE_CONFIG.twitchClientId,
      },
    });

    if (!res.ok) {
      twitchAccessToken = null;
      try {
        if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
          chrome.storage.local.remove("huddle_twitch_token");
        }
      } catch (err) {
        handleInvalidatedContext(err);
      }
      showToast("Twitch token expired. Please reconnect.", "error");
      renderTwitchView();
      return;
    }

    const data = await res.json();
    if (data.data && data.data.length > 0) {
      twitchUserInfo = data.data[0];
      isConnectedToTwitch = true;
      showToast(`Connected as ${twitchUserInfo.display_name}!`, "success");
      checkTwitchLiveStatus();
      renderTwitchView();
    }
  } catch (err) {
    console.error("[Huddle] Twitch user info error:", err);
    showToast("Failed to fetch Twitch info.", "error");
  }
}

async function checkTwitchLiveStatus() {
  if (!twitchAccessToken || !twitchUserInfo) return;

  try {
    const res = await fetch(
      `https://api.twitch.tv/helix/streams?user_id=${twitchUserInfo.id}`,
      {
        headers: {
          Authorization: `Bearer ${twitchAccessToken}`,
          "Client-Id": HUDDLE_CONFIG.twitchClientId,
        },
      },
    );

    const data = await res.json();
    twitchLiveStatus = data.data && data.data.length > 0 ? data.data[0] : null;
    renderTwitchView();
  } catch (err) {
    console.error("[Huddle] Live status check error:", err);
  }
}

/* ---------- Restore Twitch Token on Load ---------- */
function restoreTwitchToken() {
  try {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get("huddle_twitch_token", (result) => {
        if (result.huddle_twitch_token) {
          twitchAccessToken = result.huddle_twitch_token;
          fetchTwitchUserInfo();
        }
      });
    }
  } catch (err) {
    handleInvalidatedContext(err);
  }
}
