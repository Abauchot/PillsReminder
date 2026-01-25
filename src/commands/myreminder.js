const { SlashCommandBuilder } = require('discord.js');
const storage = require('../storage');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('myreminder')
        .setDescription('Check your current reminder settings'),

    async execute(interaction) {
        const userId = interaction.user.id;
        const userConfig = await storage.getUser(userId);
        const reminderTime = userConfig?.reminderTime || null;

        if (reminderTime) {
            await interaction.reply({
                content: `Your reminder time is set to **${reminderTime}**.\n\nUse \`/setreminder\` to change it.`,
                ephemeral: true
            });
        } else {
            // Get server default
            const guildId = interaction.guild?.id;
            let defaultTime = '09:00';

            if (guildId) {
                const serverConfig = await storage.getServer(guildId);
                if (serverConfig?.defaultReminderTime) {
                    defaultTime = serverConfig.defaultReminderTime;
                }
            }

            await interaction.reply({
                content: `You haven't set a custom reminder time.\n\nYou're using the server default: **${defaultTime}**.\n\nUse \`/setreminder\` to set a custom time.`,
                ephemeral: true
            });
        }
    }
};
