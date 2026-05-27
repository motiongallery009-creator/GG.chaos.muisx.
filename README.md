# 🎵 Discord Music Bot

A feature-rich Discord music bot built with `discord.js` v14 and `@discordjs/voice`, supporting YouTube playback, queue management, and more.

---

## 📋 Features

| Command | Description |
|---|---|
| `/play <query>` | Search YouTube or paste a URL to play a song |
| `/skip` | Skip the current song |
| `/pause` / `/resume` | Pause or resume playback |
| `/stop` | Stop music and disconnect from VC |
| `/queue [page]` | View the current queue |
| `/nowplaying` | Show the currently playing song |
| `/volume <1-100>` | Set the playback volume |
| `/loop <off/song/queue>` | Toggle loop modes |
| `/shuffle` | Shuffle the queue |
| `/remove <position>` | Remove a specific song from the queue |
| `/clear` | Clear the queue (keeps current song) |

---

## 🚀 Setup Guide

### 1. Prerequisites

- [Node.js](https://nodejs.org/) **v18 or later**
- [FFmpeg](https://ffmpeg.org/) installed on your system
  - **Windows**: Download from https://ffmpeg.org/download.html and add to PATH
  - **macOS**: `brew install ffmpeg`
  - **Linux**: `sudo apt install ffmpeg`

### 2. Create a Discord Application

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **New Application**, give it a name
3. Go to **Bot** → Click **Add Bot**
4. Under **Privileged Gateway Intents**, enable:
   - ✅ Server Members Intent
   - ✅ Message Content Intent
5. Copy your **Bot Token** (keep this secret!)
6. Go to **OAuth2** → copy your **Client ID**

### 3. Invite the Bot to Your Server

Use this URL (replace `YOUR_CLIENT_ID`):
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=3148800&scope=bot%20applications.commands
```

This grants: Send Messages, Connect, Speak, Use Slash Commands.

### 4. Install & Configure

```bash
# Clone / download this folder, then:
cd discord-music-bot

# Install dependencies
npm install

# Create your .env file
cp .env.example .env
```

Edit `.env` and fill in:
```
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_client_id_here
```

### 5. Register Slash Commands

```bash
node src/deploy-commands.js
```

> ⚠️ Run this once, or whenever you add/change commands. It may take up to an hour for commands to appear globally (usually instant in servers).

### 6. Start the Bot

```bash
# Production
npm start

# Development (auto-restart on changes)
npm run dev
```

---

## 🔧 Troubleshooting

**"No audio" / silent playback**
- Make sure FFmpeg is installed and in your PATH
- Run `ffmpeg -version` in your terminal to verify

**"Could not stream" errors**
- Some videos are age-restricted or region-locked
- Try a different video or search term

**Commands not appearing**
- Wait a few minutes after running `deploy-commands.js`
- Make sure the bot has the `applications.commands` scope in its invite

**Bot disconnects immediately**
- Ensure the bot has **Connect** and **Speak** permissions in the voice channel

---

## 📦 Dependencies

- [`discord.js`](https://discord.js.org/) — Discord API client
- [`@discordjs/voice`](https://github.com/discordjs/discord.js/tree/main/packages/voice) — Voice connection handling
- [`play-dl`](https://github.com/play-dl/play-dl) — YouTube audio streaming
- [`ffmpeg-static`](https://github.com/eugeneware/ffmpeg-static) — Bundled FFmpeg binary (fallback)
- [`dotenv`](https://github.com/motdotla/dotenv) — Environment variable management

---

## 🗂️ Project Structure

```
discord-music-bot/
├── src/
│   ├── index.js              # Bot entry point & event handlers
│   ├── MusicQueue.js         # Queue & audio player logic
│   ├── deploy-commands.js    # Register slash commands
│   └── commands/
│       ├── play.js           # /play command
│       └── controls.js       # All other commands
├── .env.example
├── package.json
└── README.md
```
