# Discord Medication Reminder Bot

A Discord bot that helps remind users to take their medication daily with automated follow-ups.

## Features

- **Daily Reminder**: Sends a reminder at 9:00 AM (France time/Europe/Paris timezone) to users with the `@meds` role
- **Confirmation System**: Users confirm by reacting with ✅ to the reminder message
- **Hourly Follow-ups**: Automatically pings users who haven't confirmed every hour until they do
- **Visual Embeds**: Clean, colorful embed messages for better visibility

## Setup Instructions

### 1. Create a Discord Bot

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Go to the "Bot" section and click "Add Bot"
4. Under "Privileged Gateway Intents", enable:
   - Message Content Intent
   - Server Members Intent
5. Copy your bot token (you'll need this later)

### 2. Invite the Bot to Your Server

1. In the Developer Portal, go to "OAuth2" → "URL Generator"
2. Select scopes:
   - `bot`
3. Select bot permissions:
   - Send Messages
   - Read Messages/View Channels
   - Add Reactions
   - Read Message History
   - Mention Everyone (to ping @meds role)
4. Copy the generated URL and open it in your browser to invite the bot to your server

### 3. Create the @meds Role

1. In your Discord server, go to Server Settings → Roles
2. Create a new role called `meds` (exactly as written)
3. Assign this role to all users who should receive medication reminders

### 4. Get Your Channel ID

1. Enable Developer Mode in Discord (User Settings → Advanced → Developer Mode)
2. Right-click on the channel where you want the bot to send reminders
3. Click "Copy Channel ID"

### 5. Configure the Bot

1. Create a `.env` file in the project directory (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file and add your credentials:
   ```
   DISCORD_TOKEN=your_bot_token_here
   CHANNEL_ID=your_channel_id_here
   ```

### 6. Install Dependencies

```bash
npm install
```

### 7. Run the Bot

```bash
node bot.js
```

You should see:
```
Logged in as YourBotName#1234
Bot is ready!
Cron jobs scheduled successfully
```

## How It Works

1. **At 9:00 AM (France time)**: The bot sends a message mentioning `@meds` with an embedded reminder
2. **Users react with ✅**: When a user clicks the checkmark, they're marked as having taken their medication
3. **Every hour**: The bot checks if there are users who haven't confirmed. If so, it pings them with a follow-up reminder
4. **Next day**: The cycle resets at 9:00 AM

## Deployment

### Option 1: Render.com (Recommended - Free & 24/7)

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions on deploying to Render.com.

### Option 2: Run locally with PM2

For running on your own computer:

```bash
npm install -g pm2
pm2 start bot.js --name "meds-reminder"
pm2 save
pm2 startup
```

This will keep your bot running even after system restarts.

## Troubleshooting

- **Bot doesn't respond**: Check that all required intents are enabled in the Developer Portal
- **Role not found**: Ensure the role is named exactly `meds` (lowercase)
- **Timezone issues**: The bot uses `Europe/Paris` timezone. Modify the timezone in `bot.js` if needed
- **Missing permissions**: Verify the bot has Send Messages and Add Reactions permissions in the channel

## Dependencies

- `discord.js` - Discord API wrapper
- `node-cron` - Task scheduler for timed reminders
- `dotenv` - Environment variable management
