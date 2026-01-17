const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const cron = require('node-cron');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});


let pendingUsers = new Set();
let dailyMessageId = null;
let currentDate = new Date().toDateString();

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
    console.log('Bot is ready!');

    // Schedule daily reminder at 9:00 AM France time (Europe/Paris)
    cron.schedule('0 9 * * *', async () => {
        await sendDailyReminder();
    }, {
        timezone: 'Europe/Paris'
    });

    // Schedule hourly pings for users who haven't confirmed
    cron.schedule('0 * * * *', async () => {
        await sendHourlyReminder();
    }, {
        timezone: 'Europe/Paris'
    });

    console.log('Cron jobs scheduled successfully');
    console.log('Bot is now running - Daily reminder at 9:00 AM, hourly re-pings');
});

// Handle reactions
client.on('messageReactionAdd', async (reaction, user) => {
    // Ignore bot reactions
    if (user.bot) return;

    // Fetch partial reactions
    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch (error) {
            console.error('Error fetching reaction:', error);
            return;
        }
    }

    // Check if it's the daily reminder message and the checkmark emoji
    if (reaction.message.id === dailyMessageId && reaction.emoji.name === '✅') {
        pendingUsers.delete(user.id);
        console.log(`${user.tag} confirmed taking their medication`);
    }
});

// Handle reaction removal
client.on('messageReactionRemove', async (reaction, user) => {
    if (user.bot) return;

    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch (error) {
            console.error('Error fetching reaction:', error);
            return;
        }
    }

    // If user removes their checkmark, add them back to pending
    if (reaction.message.id === dailyMessageId && reaction.emoji.name === '✅') {
        pendingUsers.add(user.id);
        console.log(`${user.tag} removed their confirmation`);
    }
});

async function sendDailyReminder() {
    try {
        const channel = await client.channels.fetch(process.env.CHANNEL_ID);

        // Reset for new day
        const today = new Date().toDateString();
        if (today !== currentDate) {
            currentDate = today;
            pendingUsers.clear();
            dailyMessageId = null;
        }

        // Get the guild and the @meds role
        const guild = channel.guild;

        // Fetch all members to populate the cache
        await guild.members.fetch();

        const medsRole = guild.roles.cache.find(role => role.name.toLowerCase() === 'meds');

        if (!medsRole) {
            console.warn('Warning: @meds role not found!');
            return;
        }

        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('💊 Daily Medication Reminder')
            .setDescription('Good morning! It\'s time to take your medication.')
            .addFields(
                { name: 'Instructions', value: 'React with ✅ to confirm you\'ve taken your meds!' },
                { name: 'Reminder', value: 'If you don\'t confirm, you\'ll be pinged every hour.' }
            )
            .setTimestamp()
            .setFooter({ text: 'Stay healthy!' });

        const message = await channel.send({
            content: `<@&${medsRole.id}>`,
            embeds: [embed]
        });

        // Add checkmark reaction
        await message.react('✅');

        // Store message ID and get all members with @meds role
        dailyMessageId = message.id;

        // Add all members with @meds role to pending users
        medsRole.members.forEach(member => {
            if (!member.user.bot) {
                pendingUsers.add(member.id);
            }
        });
        console.log(`Daily reminder sent. ${pendingUsers.size} users need to confirm.`);

    } catch (error) {
        console.error('Error sending daily reminder:', error);
    }
}

async function sendHourlyReminder() {
    // Don't send hourly reminders if no daily reminder has been sent yet
    if (!dailyMessageId || pendingUsers.size === 0) {
        return;
    }

    try {
        const channel = await client.channels.fetch(process.env.CHANNEL_ID);

        // Create mentions for all pending users
        const mentions = Array.from(pendingUsers).map(userId => `<@${userId}>`).join(' ');

        const embed = new EmbedBuilder()
            .setColor('#ffaa00')
            .setTitle('⏰ Medication Reminder')
            .setDescription('You haven\'t confirmed taking your medication yet!')
            .addFields(
                { name: 'Action Required', value: 'Please react with ✅ on the daily reminder message above.' }
            )
            .setTimestamp();

        await channel.send({
            content: mentions,
            embeds: [embed]
        });

        console.log(`Hourly reminder sent to ${pendingUsers.size} users.`);

    } catch (error) {
        console.error('Error sending hourly reminder:', error);
    }
}

client.login(process.env.DISCORD_TOKEN);
