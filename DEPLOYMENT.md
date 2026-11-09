# Deploy the Watchparty relay

The Dockerfile runs the Express and Socket.IO relay on port `4000`. Place it behind an HTTPS reverse proxy with WebSocket support. Use one replica because room state and analytics live in process memory.

| Variable | Purpose |
| --- | --- |
| `PORT` | Relay port. Defaults to `4000`. |
| `WATCHPARTY_ACCESS_KEY` | Shared relay key for Socket.IO clients. Required in production. |
| `WATCHPARTY_DASHBOARD_PASSWORD` | Password for HTTP Basic Auth at `/`, using username `admin`. If unset, the dashboard returns HTTP 503. |
| `WATCHPARTY_EXTENSION_RELAY_URL` | Relay URL to embed in the dashboard download. Defaults to the URL in `extension/scripts/config.js`. |

Use `GET /healthz` for health checks. The dashboard lists active rooms with one count per connected participant and groups URLs since process start. It drops query parameters except for the YouTube video ID. Restarting the relay clears room state and the URL history.

Use **Download the configured extension ZIP** in the authenticated dashboard to get an extension with the relay key. To build it locally, set the relay URL in `extension/scripts/config.js` and run `python3 scripts/package-extension.py` with the same `WATCHPARTY_ACCESS_KEY` in your shell. The local build writes to `dist/watchparty-extension.zip`. Distribute configured ZIPs privately. The public release ships with a blank key.

Extract the package on each laptop and use **Load unpacked** at `chrome://extensions` to load the `watchparty-extension` directory. The private relay uses the extension for room discovery. The upstream room lookup is disabled when the relay key is set.
