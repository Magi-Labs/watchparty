const { createHash, timingSafeEqual } = require("node:crypto");

const htmlEntities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (character) => htmlEntities[character]);
}

function getAnalyticsUrl(videoUrl) {
  const url = new URL(videoUrl);
  const youtubeVideo = url.hostname === "www.youtube.com" && url.pathname === "/watch"
    ? url.searchParams.get("v")
    : null;
  url.search = "";
  if (youtubeVideo && /^[\w-]{11}$/.test(youtubeVideo)) url.searchParams.set("v", youtubeVideo);
  return url.href;
}

function digest(value) {
  return createHash("sha256").update(value).digest();
}

function requireDashboardLogin(username, password) {
  const expected = password && digest(`${username}:${password}`);

  return (req, res, next) => {
    res.set("Cache-Control", "no-store");
    if (!expected) return res.status(503).type("text").send("Dashboard unavailable.");

    const credentials = /^Basic ([A-Za-z0-9+/]+={0,2})$/i.exec(req.get("Authorization") ?? "");
    if (!credentials || !timingSafeEqual(digest(Buffer.from(credentials[1], "base64")), expected)) {
      return res.set("WWW-Authenticate", 'Basic realm="Watchparty dashboard", charset="UTF-8"')
        .status(401).type("text").send("Authentication required.");
    }
    next();
  };
}

function createDashboard(rooms, watchedUrls) {
  return (req, res) => {
    const activeRooms = [...rooms].filter(([, room]) => room.members.size > 0);
    const participants = activeRooms.reduce((total, [, room]) => total + room.members.size, 0);
    const roomRows = activeRooms.map(([code, room]) =>
      `<tr><th scope="row">${escapeHtml(code)}</th><td>${escapeHtml(room.analyticsUrl)}</td><td>${room.members.size}</td></tr>`
    ).join("");
    const urlRows = [...watchedUrls].reverse().map(([url, count]) =>
      `<tr><th scope="row">${escapeHtml(url)}</th><td>${count}</td></tr>`
    ).join("");

    res.set({
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
    }).type("html").send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Watchparty dashboard</title>
  <style>
    :root { color-scheme: light dark; }
    body { font: 1rem/1.5 system-ui, sans-serif; margin: 2rem auto; max-width: 65rem; padding: 0 1rem; }
    h2 { margin-top: 2rem; }
    table { border-collapse: collapse; width: 100%; }
    th, td { text-align: left; padding: .6rem; border-bottom: 1px solid GrayText; overflow-wrap: anywhere; }
    tbody th { font-weight: normal; }
    td:last-child, thead th:last-child { text-align: right; }
  </style>
</head>
<body><main>
  <h1>Watchparty dashboard</h1>
  <p><a href="/extension.zip">Download the configured extension ZIP</a></p>
  <p>${activeRooms.length} active rooms · ${participants} connected participants · ${watchedUrls.size} unique video URLs</p>
  <h2 id="active-rooms">Active rooms</h2>
  <table aria-labelledby="active-rooms">
    <thead><tr><th scope="col">Room</th><th scope="col">Video URL</th><th scope="col">Participants</th></tr></thead>
    <tbody>${roomRows || '<tr><td colspan="3">No active rooms.</td></tr>'}</tbody>
  </table>
  <h2 id="watched-urls">Video URLs since server start</h2>
  <table aria-labelledby="watched-urls">
    <thead><tr><th scope="col">Video URL</th><th scope="col">Rooms created</th></tr></thead>
    <tbody>${urlRows || '<tr><td colspan="2">No video URLs recorded.</td></tr>'}</tbody>
  </table>
</main></body>
</html>`);
  };
}

module.exports = { createDashboard, getAnalyticsUrl, requireDashboardLogin };
