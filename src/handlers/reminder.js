const { EmbedBuilder } = require('discord.js');
const storage = require('../storage');

async function sendDailyReminderToUsers(client, guildId, serverConfig, userIds) {
    try {
        const channel = await client.channels.fetch(serverConfig.channelId);
        if (!channel) {
            console.error(`Channel not found for guild ${guildId}`);
            return;
        }

        const guild = channel.guild;

        // Create mentions for specific users
        const mentions = userIds.map(userId => `<@${userId}>`).join(' ');

        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('Daily Medication Reminder')
            .setDescription('It\'s time to take your medication.')
            .addFields(
                { name: 'Instructions', value: 'React with checkmark to confirm you\'ve taken your meds!' },
                { name: 'Reminder', value: 'If you don\'t confirm, you\'ll be pinged every hour.' }
            )
            .setTimestamp()
            .setFooter({ text: 'Stay healthy!' });

        const message = await channel.send({
            content: mentions,
            embeds: [embed]
        });

        // Add checkmark reaction
        await message.react('✅');

        // Get current server config to update pending users
        const currentConfig = await storage.getServer(guildId);
        const currentPending = currentConfig?.pendingUsers || [];

        // Add new users to pending (don't replace, merge)
        const updatedPending = [...new Set([...currentPending, ...userIds])];

        // Update server state
        await storage.updateServer(guildId, {
            dailyMessageId: message.id,
            pendingUsers: updatedPending,
            lastReminderDate: new Date().toDateString()
        });

        console.log(`[${guild.name}] Reminder sent to ${userIds.length} users. Total pending: ${updatedPending.length}`);
        return message;

    } catch (error) {
        console.error(`Error sending daily reminder to guild ${guildId}:`, error);
    }
}

async function sendDailyReminder(client, guildId, serverConfig) {
    try {
        const channel = await client.channels.fetch(serverConfig.channelId);
        if (!channel) {
            console.error(`Channel not found for guild ${guildId}`);
            return;
        }

        const guild = channel.guild;

        // Fetch all members to populate the cache
        await guild.members.fetch();

        const medsRole = guild.roles.cache.find(role => role.name.toLowerCase() === 'meds');

        if (!medsRole) {
            console.warn(`Warning: @meds role not found in guild ${guild.name}!`);
            return;
        }

        // Collect all members with @meds role
        const userIds = [];
        medsRole.members.forEach(member => {
            if (!member.user.bot) {
                userIds.push(member.id);
            }
        });

        if (userIds.length === 0) {
            console.log(`[${guild.name}] No users with @meds role`);
            return;
        }

        return await sendDailyReminderToUsers(client, guildId, serverConfig, userIds);

    } catch (error) {
        console.error(`Error sending daily reminder to guild ${guildId}:`, error);
    }
}

async function sendHourlyReminder(client, guildId, serverConfig) {
    // Don't send hourly reminders if no daily reminder or no pending users
    if (!serverConfig.dailyMessageId || !serverConfig.pendingUsers || serverConfig.pendingUsers.length === 0) {
        return;
    }

    try {
        const channel = await client.channels.fetch(serverConfig.channelId);
        if (!channel) {
            console.error(`Channel not found for guild ${guildId}`);
            return;
        }

        // Create mentions for all pending users
        const mentions = serverConfig.pendingUsers.map(userId => `<@${userId}>`).join(' ');

        const embed = new EmbedBuilder()
            .setColor('#ffaa00')
            .setTitle('Medication Reminder')
            .setDescription('You haven\'t confirmed taking your medication yet!')
            .addFields(
                { name: 'Action Required', value: 'Please react with checkmark on the daily reminder message above.' }
            )
            .setTimestamp();

        await channel.send({
            content: mentions,
            embeds: [embed]
        });

        console.log(`[${channel.guild.name}] Hourly reminder sent to ${serverConfig.pendingUsers.length} users.`);

    } catch (error) {
        console.error(`Error sending hourly reminder to guild ${guildId}:`, error);
    }
}

async function sendDailyReminderToAll(client) {
    const servers = await storage.getActiveServers();

    for (const server of servers) {
        const today = new Date().toDateString();

        // Reset for new day if needed
        if (server.lastReminderDate !== today) {
            await storage.updateServer(server.guildId, {
                pendingUsers: [],
                dailyMessageId: null
            });
        }

        // Re-fetch updated config
        const updatedConfig = await storage.getServer(server.guildId);
        await sendDailyReminder(client, server.guildId, updatedConfig);
    }
}

async function sendHourlyReminderToAll(client) {
    const servers = await storage.getActiveServers();

    for (const server of servers) {
        await sendHourlyReminder(client, server.guildId, server);
    }
}

module.exports = {
    sendDailyReminder,
    sendDailyReminderToUsers,
    sendHourlyReminder,
    sendDailyReminderToAll,
    sendHourlyReminderToAll
};
