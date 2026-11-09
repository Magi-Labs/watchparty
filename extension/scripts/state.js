/* === Huddle — State === */

/* ---------- State ---------- */
let videoPlayer = null;
let mySocketId = null;
let currentRoomCode = null;
let roomVideoUrl = null;
let pendingInviteCode = null;
let displayName = "";
const roomChatMessages = [];
let isConnectedToTwitch = false;
let twitchAccessToken = null;
let twitchUserInfo = null;
let twitchLiveStatus = null;
let currentPage = "main"; // 'main' | 'twitch' | 'room'
