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

## Local Setup

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

1. Fork this repository to your GitHub account

2. Create a [Railway](https://railway.app) account

   - Sign up with your GitHub account
   - Choose the free plan (500 hours/month)

3. Create a new project in Railway:

   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your forked repository
   - Railway will automatically detect the Procfile and Node.js setup

4. Add environment variables in Railway:

   - Go to your project's "Variables" tab
   - Add the following variables:
     - `DISCORD_TOKEN` (your Discord bot token)
     - `CLIENT_ID` (your Discord application client ID)

5. Deploy:
   - Railway will automatically deploy your bot
   - Each push to main will trigger a new deployment

## Monitoring

- View logs in Railway's "Deployments" tab
- Check CPU and memory usage in "Metrics"
- Set up notifications for deployment failures

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

## Troubleshooting

If the bot goes offline:

1. Check Railway logs for errors
2. Verify environment variables are set
3. Check if you've exceeded free tier limits
4. Ensure your Discord token is valid
