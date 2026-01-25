const { Client, GatewayIntentBits } = require('discord.js');
const storage = require('./storage');
const { handleReactionAdd, handleReactionRemove } = require('./handlers/reactions');
const { registerCommands, handleInteraction } = require('./commands');
const { startScheduler, startTestScheduler } = require('./scheduler');

function createClient() {
    return new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.GuildMessageReactions,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.GuildMembers
        ]
    });
}

async function setupClient(client, options = {}) {
    const { testMode = false } = options;

    client.once('ready', async () => {
        console.log(`Logged in as ${client.user.tag}`);
        console.log('Bot is ready!');

        // Initialize storage
        await storage.initStorage();

        // Register slash commands
        await registerCommands(client.user.id, process.env.DISCORD_TOKEN);

        // Start scheduler
        if (testMode) {
            startTestScheduler(client);
        } else {
            startScheduler(client);
        }

        console.log('Bot is now running');
    });

    // Handle reactions
    client.on('messageReactionAdd', handleReactionAdd);
    client.on('messageReactionRemove', handleReactionRemove);

    // Handle slash commands
    client.on('interactionCreate', handleInteraction);

    // Handle joining new servers
    client.on('guildCreate', async (guild) => {
        console.log(`Joined new server: ${guild.name}`);
        const existingConfig = await storage.getServer(guild.id);
        if (!existingConfig) {
            await storage.setServer(guild.id, storage.createDefaultServerConfig());
            console.log(`Created default config for ${guild.name}`);
        }
    });

    // Handle leaving servers
    client.on('guildDelete', async (guild) => {
        console.log(`Left server: ${guild.name}`);
        // Optionally disable rather than delete
        await storage.updateServer(guild.id, { enabled: false });
    });
}

module.exports = {
    createClient,
    setupClient
};
