"""Build a private Chrome extension ZIP using WATCHPARTY_ACCESS_KEY."""

import json
import os
from pathlib import Path
import zipfile


root = Path(__file__).resolve().parents[1]
key = os.environ.get("WATCHPARTY_ACCESS_KEY")
if not key:
    raise SystemExit("Set WATCHPARTY_ACCESS_KEY to the relay's access key.")

extension = root / "extension"
config = extension / "scripts" / "config.js"
placeholder = 'accessKey: ""'
config_text = config.read_text(encoding="utf-8")
if config_text.count(placeholder) != 1:
    raise SystemExit("Expected one blank accessKey in the extension configuration.")

output = root / "dist" / "watchparty-extension.zip"
output.parent.mkdir(exist_ok=True)
descriptor = os.open(output, os.O_CREAT | os.O_TRUNC | os.O_WRONLY, 0o600)
with os.fdopen(descriptor, "wb") as file, zipfile.ZipFile(
    file, "w", compression=zipfile.ZIP_DEFLATED
) as archive:
    for path in sorted(extension.rglob("*")):
        if not path.is_file() or path.name.startswith("."):
            continue
        name = Path("watchparty-extension") / path.relative_to(extension)
        if path == config:
            archive.writestr(str(name), config_text.replace(placeholder, f"accessKey: {json.dumps(key)}"))
        else:
            archive.write(path, name)
    archive.write(root / "LICENSE", "watchparty-extension/LICENSE")

print(output)
