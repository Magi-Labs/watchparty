# Private Watch Party

The Dokploy application builds the repository's `Dockerfile` and proxies `watchparty.deepaksilaych.me` to port 4000 with HTTPS and WebSocket support. Set `WATCHPARTY_ACCESS_KEY` in the Dokploy application's environment. Generate a strong random key and keep it out of Git.

To package the Chrome extension, supply the same `WATCHPARTY_ACCESS_KEY` in your shell and run `python3 scripts/package-extension.py`. Share the resulting `dist/watchparty-extension.zip` privately because it contains the key. The ZIP is ignored by Git.

On each laptop, extract the ZIP and open `chrome://extensions`. Turn on **Developer mode**, click **Load unpacked**, and select the extracted `watchparty-extension` folder. Keep that folder on disk. Open the same movie on both laptops, click the Huddle extension, and have one person create a room and the other join with its code.

Each laptop plays the movie with its own streaming access. The relay synchronizes playback actions. The health endpoint is `/`. The optional upstream room landing page is disabled for this deployment.
