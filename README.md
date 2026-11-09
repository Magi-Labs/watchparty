# Watchparty

Watchparty extends the original Huddle Chrome extension with shared playback controls, room chat, reactions, and a self-hosted relay. [Original Huddle repository](https://github.com/Full-Stack-boi/Huddle)

## What changed

- Any participant can play, pause, or seek. The relay broadcasts those actions and corrects playback drift every five seconds when multiple participants are connected.
- Rooms have no owner. A room stays open while anyone is connected and expires after 30 seconds empty.
- The extension supports invite links, chat replies, quick reactions, and timestamped playback activity. Its panel can dock beside the video and supports adjustable width and light and dark themes.
- The relay dashboard shows active rooms, participant counts, and video URLs recorded since the relay started.

## Run locally

Install the dependencies with `npm ci` and start the relay with `npm start`. The default port is `4000`. Set `WATCHPARTY_DASHBOARD_PASSWORD` in the relay environment to enable the dashboard at `/`. Set `WATCHPARTY_DASHBOARD_USERNAME` to override the default username `admin`. The health endpoint is `/healthz`.

Point `syncServerUrl` in `extension/scripts/config.js` at your relay. Open `chrome://extensions`, enable **Developer mode**, and choose **Load unpacked**. Select the `extension/` directory or the extracted `watchparty-extension/` directory from the public release. The public build has a blank relay key and is intended for self-hosting.

Open a supported video on each laptop, then create a room and share the invite link or room code. Each participant streams the video through their own streaming service account. The extension runs on YouTube, Netflix, Hotstar, Prime Video, and Twitch Clips.

## Architecture

`extension/` contains the Manifest V3 extension. `server/` contains the Express and Socket.IO relay. The relay stores rooms, recent chat, and dashboard analytics in memory. `public/` and `api/` contain upstream landing page and Twitch integration code for optional hosting.

See [Deployment](DEPLOYMENT.md) for Docker and credential configuration. Development prompts are available in a private repository in the Magi Labs organization.

Distributed under the [PolyForm Noncommercial License 1.0.0](LICENSE).
