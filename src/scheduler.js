const cron = require('node-cron');
const storage = require('./storage');
const { sendDailyReminderToUsers, sendHourlyReminder } = require('./handlers/reminder');

// Store scheduled jobs so we can manage them
const scheduledJobs = {
    minuteCheck: null,
    hourlyReminder: null
};

function getCurrentTimeInTimezone(timezone) {
    const now = new Date();
    const options = { timeZone: timezone, hour: '2-digit', minute: '2-digit', hour12: false };
    return now.toLocaleTimeString('en-US', options).slice(0, 5); // Returns "HH:MM"
}

function getTodayDateString(timezone) {
    const now = new Date();
    const options = { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' };
    return now.toLocaleDateString('en-US', options);
}

async function checkAndSendReminders(client) {
    const servers = await storage.getActiveServers();
    const users = await storage.loadUsers();
    const defaultTimezone = 'Europe/Paris';

    for (const server of servers) {
        try {
            const serverTimezone = server.timezone || defaultTimezone;
            const serverTime = getCurrentTimeInTimezone(serverTimezone);
            const serverToday = getTodayDateString(serverTimezone);
            const defaultTime = server.defaultReminderTime || '09:00';

            // Clean up old dates
            await storage.clearOldReminderDates(server.guildId, serverToday);

            // Get the channel and guild
            const channel = await client.channels.fetch(server.channelId);
            if (!channel) continue;

            const guild = channel.guild;
            await guild.members.fetch();

            const medsRole = guild.roles.cache.find(role => role.name.toLowerCase() === 'meds');
            if (!medsRole) continue;

            // Find users whose reminder time is NOW
            const usersToRemind = [];

            for (const member of medsRole.members.values()) {
                if (member.user.bot) continue;

                const userId = member.id;

                // Check if already reminded today
                const alreadyReminded = await storage.wasUserRemindedToday(server.guildId, userId, serverToday);
                if (alreadyReminded) continue;

                // Get user's custom time or use server default
                const userTime = users[userId]?.reminderTime || defaultTime;

                // If it's their time, add them to the list
                if (serverTime === userTime) {
                    usersToRemind.push(userId);
                }
            }

            // Send reminder to users whose time is now
            if (usersToRemind.length > 0) {
                await sendDailyReminderToUsers(client, server.guildId, server, usersToRemind);

                // Mark these users as reminded today
                for (const userId of usersToRemind) {
                    await storage.addUserToRemindedToday(server.guildId, userId, serverToday);
                }
            }
        } catch (error) {
            console.error(`Error checking reminders for guild ${server.guildId}:`, error);
        }
    }
}

async function sendHourlyReminders(client) {
    const servers = await storage.getActiveServers();

    for (const server of servers) {
        // Only send hourly reminders if daily was sent and users are pending
        if (server.dailyMessageId && server.pendingUsers && server.pendingUsers.length > 0) {
            await sendHourlyReminder(client, server.guildId, server);
        }
    }
}

function startScheduler(client, options = {}) {
    const {
        dailyCron = '* * * * *',  // Every minute (checks if it's the right time)
        hourlyCron = '0 * * * *', // Every hour at :00
        timezone = 'Europe/Paris'
    } = options;

    // Minute-by-minute check for daily reminders (to support custom times)
    scheduledJobs.minuteCheck = cron.schedule(dailyCron, async () => {
        await checkAndSendReminders(client);
    }, { timezone });

    // Hourly reminder for users who haven't confirmed
    scheduledJobs.hourlyReminder = cron.schedule(hourlyCron, async () => {
        await sendHourlyReminders(client);
    }, { timezone });

    console.log('Scheduler started');
    console.log(`- Daily check: ${dailyCron}`);
    console.log(`- Hourly reminder: ${hourlyCron}`);
}

function startTestScheduler(client) {
    // Fast cycles for testing
    startScheduler(client, {
        dailyCron: '*/2 * * * *',  // Every 2 minutes
        hourlyCron: '* * * * *',   // Every minute
        timezone: 'Europe/Paris'
    });
    console.log('TEST MODE: Fast scheduler cycles enabled');
}

function stopScheduler() {
    if (scheduledJobs.minuteCheck) {
        scheduledJobs.minuteCheck.stop();
        scheduledJobs.minuteCheck = null;
    }
    if (scheduledJobs.hourlyReminder) {
        scheduledJobs.hourlyReminder.stop();
        scheduledJobs.hourlyReminder = null;
    }
    console.log('Scheduler stopped');
}

module.exports = {
    startScheduler,
    startTestScheduler,
    stopScheduler,
    checkAndSendReminders,
    sendHourlyReminders,
    getCurrentTimeInTimezone,
    getTodayDateString
};
