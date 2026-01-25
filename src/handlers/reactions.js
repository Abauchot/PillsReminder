const storage = require('../storage');

async function handleReactionAdd(reaction, user) {
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

    // Only handle checkmark emoji
    if (reaction.emoji.name !== '✅') return;

    const guildId = reaction.message.guild?.id;
    if (!guildId) return;

    const serverConfig = await storage.getServer(guildId);
    if (!serverConfig) return;

    // Check if it's the daily reminder message
    if (reaction.message.id === serverConfig.dailyMessageId) {
        // Remove user from pending list
        const pendingUsers = serverConfig.pendingUsers.filter(id => id !== user.id);
        await storage.updateServer(guildId, { pendingUsers });
        console.log(`[${reaction.message.guild.name}] ${user.tag} confirmed taking their medication`);
    }
}

async function handleReactionRemove(reaction, user) {
    if (user.bot) return;

    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch (error) {
            console.error('Error fetching reaction:', error);
            return;
        }
    }

    // Only handle checkmark emoji
    if (reaction.emoji.name !== '✅') return;

    const guildId = reaction.message.guild?.id;
    if (!guildId) return;

    const serverConfig = await storage.getServer(guildId);
    if (!serverConfig) return;

    // Check if it's the daily reminder message
    if (reaction.message.id === serverConfig.dailyMessageId) {
        // Add user back to pending list if not already there
        const pendingUsers = serverConfig.pendingUsers || [];
        if (!pendingUsers.includes(user.id)) {
            pendingUsers.push(user.id);
            await storage.updateServer(guildId, { pendingUsers });
            console.log(`[${reaction.message.guild.name}] ${user.tag} removed their confirmation`);
        }
    }
}

module.exports = {
    handleReactionAdd,
    handleReactionRemove
};
