const { readdirSync, readFileSync } = require("node:fs");
const { join } = require("node:path");
const { zipSync } = require("fflate");

const root = join(__dirname, "..");

function readExtension(directory) {
  const files = Object.create(null);
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files[entry.name] = readExtension(path);
    if (entry.isFile()) files[entry.name] = readFileSync(path);
  }
  return files;
}

function createExtensionDownload(accessKey, relayUrl) {
  let archive;
  return (req, res) => {
    if (!archive) {
      const files = readExtension(join(root, "extension"));
      const config = files.scripts["config.js"].toString();
      const placeholder = 'accessKey: ""';
      if (!config.includes(placeholder)) throw new Error("Missing blank extension access key");

      let configured = config.replace(placeholder, () => `accessKey: ${JSON.stringify(accessKey)}`);
      if (relayUrl) {
        configured = configured.replace(/syncServerUrl: "[^"]*"/, () => `syncServerUrl: ${JSON.stringify(relayUrl)}`);
      }
      files.scripts["config.js"] = Buffer.from(configured);
      files.LICENSE = readFileSync(join(root, "LICENSE"));
      archive = Buffer.from(zipSync({ "watchparty-extension": files }));
    }

    res.attachment("extension.zip")
      .set("X-Content-Type-Options", "nosniff")
      .set("Content-Length", String(archive.length))
      .end(archive);
  };
}

module.exports = { createExtensionDownload };
