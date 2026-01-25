const { SlashCommandBuilder } = require('discord.js');
const storage = require('../storage');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setreminder')
        .setDescription('Set your personal reminder time')
        .addStringOption(option =>
            option.setName('time')
                .setDescription('Time in HH:MM format (24h), e.g., 09:00 or 14:30')
                .setRequired(true)
        ),

    async execute(interaction) {
        const time = interaction.options.getString('time');

        // Validate HH:MM format
        const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
        const match = time.match(timeRegex);

        if (!match) {
            return interaction.reply({
                content: 'Invalid time format. Please use HH:MM (24-hour format).\n\nExamples:\n- `09:00` for 9 AM\n- `14:30` for 2:30 PM\n- `21:00` for 9 PM',
                ephemeral: true
            });
        }

        // Normalize to HH:MM format (add leading zero if needed)
        const hours = match[1].padStart(2, '0');
        const minutes = match[2];
        const normalizedTime = `${hours}:${minutes}`;

        await storage.setUserReminderTime(interaction.user.id, normalizedTime);

        await interaction.reply({
            content: `Your reminder time has been set to **${normalizedTime}**.\n\nYou will receive your daily medication reminder at this time.`,
            ephemeral: true
        });

        console.log(`[User] ${interaction.user.tag} set reminder time to ${normalizedTime}`);
    }
};
