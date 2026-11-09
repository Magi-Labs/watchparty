/* === Huddle — Config === */
/* ============================================
   HUDDLE — Content Script (Chrome Extension)
   Real-time video sync with Twitch integration
   ============================================ */

/* ---------- Configuration ---------- */
const HUDDLE_CONFIG = {
  syncServerUrl: "https://watchparty.deepaksilaych.me",
  accessKey: "", // Filled when packaging the private extension.
  twitchClientId: "", // TODO: Set your Twitch Client ID
  twitchRedirectUri: "", // TODO: Set your Vercel OAuth redirect URL
  toastDuration: 4000, // 4 seconds
};
