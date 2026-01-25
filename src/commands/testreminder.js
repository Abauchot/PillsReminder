const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const storage = require('../storage');

// Track active test reminders (userId -> timeout)
const activeTestReminders = new Map();

const data = new SlashCommandBuilder()
    .setName('testreminder')
    .setDescription('Test reminder - pings you now and re-pings after 30s if not confirmed');

async function execute(interaction) {
    const userId = interaction.user.id;
    const guildId = interaction.guildId;
    const channel = interaction.channel;

    // Check if server is set up
    const serverConfig = await storage.getServer(guildId);
    if (!serverConfig || !serverConfig.channelId) {
        await interaction.reply({
            content: 'Server not set up! An admin needs to run `/setup #channel` first.',
            ephemeral: true
        });
        return;
    }

    // Clear any existing test reminder for this user
    if (activeTestReminders.has(userId)) {
        clearTimeout(activeTestReminders.get(userId));
        activeTestReminders.delete(userId);
    }

    // Send immediate test reminder
    const embed = new EmbedBuilder()
        .setColor('#ff00ff')
        .setTitle('TEST - Medication Reminder')
        .setDescription('This is a **test reminder**. React with checkmark to confirm!')
        .addFields(
            { name: 'Re-ping in', value: '30 seconds if not confirmed' },
            { name: 'Note', value: 'This is for testing only - does not affect your daily reminder.' }
        )
        .setTimestamp()
        .setFooter({ text: 'Test Mode' });

    const message = await channel.send({
        content: `<@${userId}>`,
        embeds: [embed]
    });

    await message.react('✅');

    await interaction.reply({
        content: 'Test reminder sent! React with ✅ within 30 seconds to stop the re-ping.',
        ephemeral: true
    });

    // Set up 30-second re-ping
    const timeout = setTimeout(async () => {
        try {
            // Check if user reacted
            const fetchedMessage = await channel.messages.fetch(message.id);
            const reaction = fetchedMessage.reactions.cache.get('✅');

            let userReacted = false;
            if (reaction) {
                const users = await reaction.users.fetch();
                userReacted = users.has(userId);
            }

            if (!userReacted) {
                const repingEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('TEST - Reminder Follow-up')
                    .setDescription('You haven\'t confirmed yet! This is your 30-second follow-up.')
                    .setTimestamp()
                    .setFooter({ text: 'Test Mode - Re-ping' });

                await channel.send({
                    content: `<@${userId}> - You didn't confirm your test reminder!`,
                    embeds: [repingEmbed]
                });
                console.log(`[TEST] Re-ping sent to user ${userId}`);
            } else {
                console.log(`[TEST] User ${userId} confirmed, no re-ping needed`);
            }
        } catch (error) {
            console.error('Error in test reminder follow-up:', error);
        } finally {
            activeTestReminders.delete(userId);
        }
    }, 30000); // 30 seconds

    activeTestReminders.set(userId, timeout);
    console.log(`[TEST] Test reminder started for user ${userId}`);
}

module.exports = {
    data,
    execute
};
