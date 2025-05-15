# Discord Music Bot

A Discord bot that plays YouTube audio in voice channels.

## Features

- Play YouTube audio in voice channels
- Queue system for multiple songs
- Skip, stop, and queue management commands
- Automatic playback of next song in queue

## Commands

- `/play [url]` - Play a YouTube video or add it to queue
- `/stop` - Stop playing and clear the queue
- `/skip` - Skip to the next song in queue
- `/queue` - Show the current queue

## Setup

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with your Discord bot token:
   ```
   DISCORD_TOKEN=your_token_here
   CLIENT_ID=your_client_id_here
   ```

## Deployment on Railway

1. Create a [Railway](https://railway.app) account
2. Fork this repository to your GitHub account
3. Create a new project in Railway and connect it to your GitHub repository
4. Add the following environment variables in Railway:
   - `DISCORD_TOKEN`
   - `CLIENT_ID`
5. Deploy the project

Railway will automatically:

- Install dependencies
- Run the bot using the Procfile
- Keep the bot running 24/7

## Development

To run the bot locally:

```bash
npm run dev
```

This will start the bot with nodemon for automatic reloading during development.

## Requirements

- Node.js 16.x or higher
- FFmpeg (installed automatically via ffmpeg-static)
- Discord Bot Token
- Discord Application Client ID
