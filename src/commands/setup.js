const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const storage = require('../storage');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Set the reminder channel for this server (admin only)')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel where reminders will be sent')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');
        const guildId = interaction.guild.id;

        // Get existing config or create new one
        let serverConfig = await storage.getServer(guildId);
        if (!serverConfig) {
            serverConfig = storage.createDefaultServerConfig();
        }

        // Update channel
        serverConfig.channelId = channel.id;
        await storage.setServer(guildId, serverConfig);

        await interaction.reply({
            content: `Reminder channel set to ${channel}! Make sure the bot has permission to send messages there.\n\nUsers with the \`@meds\` role will receive daily reminders at ${serverConfig.defaultReminderTime}.`,
            ephemeral: true
        });

        console.log(`[${interaction.guild.name}] Setup complete - channel: #${channel.name}`);
    }
};
