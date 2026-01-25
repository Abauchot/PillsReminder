const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const SERVERS_FILE = path.join(DATA_DIR, 'servers.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

async function initStorage() {
    await fs.mkdir(DATA_DIR, { recursive: true });

    // Initialize servers.json if it doesn't exist
    try {
        await fs.access(SERVERS_FILE);
    } catch {
        await fs.writeFile(SERVERS_FILE, JSON.stringify({}, null, 2));
    }

    // Initialize users.json if it doesn't exist
    try {
        await fs.access(USERS_FILE);
    } catch {
        await fs.writeFile(USERS_FILE, JSON.stringify({}, null, 2));
    }

    console.log('Storage initialized');
}

async function loadServers() {
    try {
        const data = await fs.readFile(SERVERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading servers:', error);
        return {};
    }
}

async function saveServers(servers) {
    // Atomic write: write to temp file then rename
    const tempFile = SERVERS_FILE + '.tmp';
    await fs.writeFile(tempFile, JSON.stringify(servers, null, 2));
    await fs.rename(tempFile, SERVERS_FILE);
}

async function getServer(guildId) {
    const servers = await loadServers();
    return servers[guildId] || null;
}

async function setServer(guildId, config) {
    const servers = await loadServers();
    servers[guildId] = config;
    await saveServers(servers);
}

async function updateServer(guildId, updates) {
    const servers = await loadServers();
    if (!servers[guildId]) {
        servers[guildId] = createDefaultServerConfig();
    }
    servers[guildId] = { ...servers[guildId], ...updates };
    await saveServers(servers);
    return servers[guildId];
}

async function deleteServer(guildId) {
    const servers = await loadServers();
    delete servers[guildId];
    await saveServers(servers);
}

function createDefaultServerConfig() {
    return {
        channelId: null,
        timezone: 'Europe/Paris',
        defaultReminderTime: '09:00',
        enabled: true,
        dailyMessageId: null,
        pendingUsers: [],
        lastReminderDate: null
    };
}

async function loadUsers() {
    try {
        const data = await fs.readFile(USERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading users:', error);
        return {};
    }
}

async function saveUsers(users) {
    const tempFile = USERS_FILE + '.tmp';
    await fs.writeFile(tempFile, JSON.stringify(users, null, 2));
    await fs.rename(tempFile, USERS_FILE);
}

async function getUser(userId) {
    const users = await loadUsers();
    return users[userId] || null;
}

async function setUserReminderTime(userId, time) {
    const users = await loadUsers();
    if (!users[userId]) {
        users[userId] = {};
    }
    users[userId].reminderTime = time;
    await saveUsers(users);
    return users[userId];
}

async function getUserReminderTime(userId) {
    const user = await getUser(userId);
    return user?.reminderTime || null;
}

// Track which users have been reminded today (per server)
async function markUserReminded(guildId, date) {
    const servers = await loadServers();
    if (!servers[guildId]) return;

    if (!servers[guildId].usersRemindedToday) {
        servers[guildId].usersRemindedToday = {};
    }
    servers[guildId].usersRemindedToday[date] = servers[guildId].usersRemindedToday[date] || [];
    await saveServers(servers);
}

async function addUserToRemindedToday(guildId, userId, date) {
    const servers = await loadServers();
    if (!servers[guildId]) return;

    if (!servers[guildId].usersRemindedToday) {
        servers[guildId].usersRemindedToday = {};
    }
    if (!servers[guildId].usersRemindedToday[date]) {
        servers[guildId].usersRemindedToday[date] = [];
    }
    if (!servers[guildId].usersRemindedToday[date].includes(userId)) {
        servers[guildId].usersRemindedToday[date].push(userId);
    }
    await saveServers(servers);
}

async function wasUserRemindedToday(guildId, userId, date) {
    const servers = await loadServers();
    if (!servers[guildId]?.usersRemindedToday?.[date]) return false;
    return servers[guildId].usersRemindedToday[date].includes(userId);
}

async function clearOldReminderDates(guildId, currentDate) {
    const servers = await loadServers();
    if (!servers[guildId]?.usersRemindedToday) return;

    // Keep only current date
    const toKeep = servers[guildId].usersRemindedToday[currentDate] || [];
    servers[guildId].usersRemindedToday = { [currentDate]: toKeep };
    await saveServers(servers);
}

// Get all servers that have a channel configured
async function getActiveServers() {
    const servers = await loadServers();
    return Object.entries(servers)
        .filter(([_, config]) => config.channelId && config.enabled)
        .map(([guildId, config]) => ({ guildId, ...config }));
}

module.exports = {
    initStorage,
    loadServers,
    saveServers,
    getServer,
    setServer,
    updateServer,
    deleteServer,
    createDefaultServerConfig,
    loadUsers,
    saveUsers,
    getUser,
    setUserReminderTime,
    getUserReminderTime,
    getActiveServers,
    addUserToRemindedToday,
    wasUserRemindedToday,
    clearOldReminderDates
};
