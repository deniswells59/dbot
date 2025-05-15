# Discord Hey Bot

A simple Discord bot that responds with "Hey!" when you use the `/hey` slash command.

## Setup Instructions

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the root directory and add your Discord bot token and client ID:

```
DISCORD_TOKEN=your_discord_bot_token_here
CLIENT_ID=your_application_client_id_here
```

3. To get your Discord bot token and client ID:

   - Go to the [Discord Developer Portal](https://discord.com/developers/applications)
   - Create a new application
   - Copy the "Application ID" (this is your CLIENT_ID)
   - Go to the "Bot" section
   - Click "Add Bot"
   - Copy the token (this is your DISCORD_TOKEN)
   - Under "Privileged Gateway Intents", make sure "SERVER MEMBERS INTENT" is enabled

4. Invite the bot to your server:

   - In the Developer Portal, go to "OAuth2" > "URL Generator"
   - Select the following scopes:
     - `bot`
     - `applications.commands`
   - Select the following bot permissions:
     - `Send Messages`
     - `Use Slash Commands`
   - Copy the generated URL and open it in your browser to invite the bot

5. Start the bot:

```bash
npm start
```

## Usage

Type `/hey` in any channel where the bot has access, and it will respond with "Hey!"

Note: After starting the bot for the first time, it may take a few minutes for the slash command to be registered and appear in Discord.
