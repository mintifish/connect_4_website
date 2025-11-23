# Connect Four — Two Browser Game

This repository contains a minimal WebSocket server and a browser client to play Connect Four between two browsers.

Files:
- `index.html` — browser client (open in two browser windows/tabs)
- `server.js` — Node WebSocket server (port 3000)
- `package.json` — dependencies and start script

Quick start (Windows PowerShell):

1. Install dependencies

```powershell
cd "c:\Users\tianh\Desktop\connect_4_website"
npm install
```

2. Start the WebSocket server

```powershell
# Connect Four — Two Browser Game

This repository contains a minimal Node server that serves a browser client and runs a WebSocket game engine so two browsers can play Connect Four.

Files:
- `public/index.html` — browser client
- `server.js` — HTTP + WebSocket server (port 3000)
- `package.json` — dependencies and start script

Quick start (Windows PowerShell):

1. Install dependencies

```powershell
cd "c:\Users\tianh\Desktop\connect_4_website"
npm install
```

2. Start the server

```powershell
npm start
```

3. Open the game in a browser

- Locally (same machine): open http://localhost:3000 in two tabs/windows and join the same room id (or leave blank and copy the generated id from the status message).
- On your LAN (other devices on the same network): find your machine IP (PowerShell):

```powershell
ipconfig | select-string "IPv4"
```

Then open http://<YOUR_IP>:3000 on another device and join the same room id.

Expose publicly (quick, for testing) — using ngrok:

1. Install ngrok from https://ngrok.com and run:

```powershell
ngrok http 3000
```

2. ngrok will show a public HTTPS URL (for example `https://abcd-1234.ngrok.io`). Open that URL in two browsers and join the same room id. The client uses the page origin for WebSocket connections so this will work out of the box.

Notes & troubleshooting
- If `npm` is not recognized, install Node.js (LTS) from https://nodejs.org or use `winget install OpenJS.NodeJS.LTS -e`.
- Windows may prompt to allow Node.js through the firewall — allow it for private networks to enable LAN access.
- If the client shows "Connection error", open Developer Tools (F12) → Console to see the WebSocket error. Typical causes: server not running, port blocked, or wrong host.

Want help?
- I can add a copy-button for room ids, a rematch flow, or user names.
- I can also add a small script to produce a Windows service or a Dockerfile for deployment — tell me which you prefer.

Enjoy!
