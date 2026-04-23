# PenguinWorld 🐧

A multiplayer Club Penguin-inspired web game. Pick a username and color, waddle around, chat with others, and explore three rooms.

## Features

- Real-time multiplayer via Socket.IO
- 3 rooms: Town Square, Beach, Dance Floor
- Click-to-move with smooth interpolation
- Chat bubbles that fade after 4 seconds
- Room portals (click them to change rooms)
- Online player list per room
- Pixel-art style penguin avatars drawn with Canvas
- Mobile-friendly (tap to move)

## Run Locally

```bash
npm install
npm start
```

Open http://localhost:3000

## Deploy to Railway

1. Push this repo to GitHub
2. Go to https://railway.app → New Project → Deploy from GitHub
3. Select this repo — Railway auto-detects `npm start`
4. Done. Railway sets `PORT` automatically.

No environment variables or build step required.