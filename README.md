# CyberRemote Pro (keys)

Turn your phone into a wireless trackpad, mouse and virtual keyboard for your desktop over local Wi‑Fi.

This repository contains the Go host application and the client web UI served from the host. The host opens a local HTTP server (port 3020 by default), serves the mobile controller UI and exposes a WebSocket endpoint for low‑latency input events.

Homepage: https://wscodework.me/keys/

## Key features

- Mobile trackpad (pointer move + taps for left/right click)
- Virtual keyboard with modifiers (Ctrl / Alt / Shift) and holdable backspace
- One‑click pairing via embedded QR code (/api/qrcode)
- Small, native Go host binary (CGO enabled) with optional fallback to xdotool on Linux
- Single active mobile device at a time (host enforces one connection)

## Repository layout

- main.go         — Go host implementation (HTTP server, WebSocket, input handling)
- public/         — Static web UI (index.html, app.js, styles)
- build.sh        — Simple Linux build helper
- build_all.sh    — Cross‑build helper for Linux/Windows (requires cross toolchain)
- go.mod / go.sum — Go module files

## Requirements

- Go 1.25 or newer
- CGO enabled for robotgo (the project uses robotgo for native input on non‑Linux platforms)
- For building Windows binaries on Linux: mingw‑w64 toolchain (if using `build_all.sh`)
- On Linux, xdotool is used as a fallback for some mouse actions (install if desired)

Note: robotgo and the native input libraries may require additional system development packages (X11 headers, libXtst, etc.) depending on your OS and distribution.

## Quick start (development)

Clone the repo:
git clone https://github.com/sameer-softengs/keys.git cd keys

Code

Run the host (development):

go run main.go

Code

Open a browser on the same machine to view the desktop dashboard (served from the host). The mobile UI is accessible by scanning the QR code displayed in the dashboard or opening http://<host-ip>:3020 from your phone.

## Build

Make sure you have the required system toolchain and CGO enabled.

Build a local Linux binary (uses `build.sh`):

./build.sh

output: dist/MouseRemote_linux
Code

Cross‑build Linux and Windows binaries (requires mingw / cross compiler):

./build_all.sh

outputs: dist/bin/cyberremote-linux
dist/bin/cyberremote-windows.exe
Code

You can also build manually:

CGO_ENABLED=1 go build -ldflags="-s -w" -o dist/cyberremote main.go

Code

## Runtime details

- Default listening port: 3020
- Web root serves the UI from embedded `public/` files
- WebSocket endpoint: `/ws`
- Status API: `/api/status` — returns JSON with `running` and `mobileUrl`
- QR code endpoint: `/api/qrcode?url=<url>` — returns PNG QR encoding the provided URL (defaults to the host mobile URL)

WebSocket message format (JSON):

```json
{
  "type": "MOUSE_MOVE" | "MOUSE_CLICK" | "KEY_PRESS" | "KEY_SPECIAL",
  "dx": <number>,            // for MOUSE_MOVE
  "dy": <number>,            // for MOUSE_MOVE
  "button": "left"|"right",  // for MOUSE_CLICK
  "key": "a"|"enter"|"backspace"|..., // for KEY_* messages
  "modifiers": ["ctrl","alt","shift"] // optional
}
Behavior notes:

The host enforces only a single active WebSocket connection; additional connection attempts will return HTTP 423 (Locked) with message "Only one device allowed at a time".
On Linux the code attempts to use xdotool for mouse movement/clicks as a fallback. If xdotool is unavailable some actions may not work — install xdotool for best compatibility:
Code
# Debian/Ubuntu
sudo apt-get install xdotool
robotgo requires CGO and OS-specific libraries; consult robotgo docs if you hit build errors related to C headers or missing libraries.
Security & privacy
The server is intended for trusted local networks only. It does not perform authentication other than a client-side generated session token in the UI. Do not expose the server to untrusted networks or the public internet.
The host will open a browser/tab (attempts xdg‑open / open / rundll32) to display the dashboard when starting.
Troubleshooting
If the UI shows "Desktop Host Not Detected" when visiting from a phone, confirm the phone and host are on the same LAN and the host firewall allows incoming connections on port 3020.
If building fails on robotgo calls, ensure CGO is enabled and that required OS development packages (X11 headers, libXtst, etc.) are installed.
For cross‑compile failures, install mingw‑w64 or build on a native Windows machine for the Windows binary.
Contributing
Contributions are welcome. Please open issues for bugs or feature requests and submit pull requests for changes. Suggested contribution flow:

Fork the repository
Create a feature branch
Open a pull request against sameer-softengs/keys:main
License
No license file is included in this repository. If you want others to use or contribute under a permissive license, add a LICENSE file (for example, MIT or Apache‑2.0).

Acknowledgements
robotgo — native input control
gorilla/websocket — WebSocket support
go-qrcode — QR code generation
