/**
 * Test bot with fast cycles for development
 * - Daily reminder: every 2 minutes
 * - Hourly reminder: every 1 minute
 *
 * Run with: node bot-test.js
 */

const { createClient, setupClient } = require('./src/client');

console.log('========================================');
console.log('   PILLS REMINDER BOT - TEST MODE');
console.log('========================================');
console.log('Fast cycles enabled:');
console.log('  - Daily check: every 2 minutes');
console.log('  - Hourly ping: every 1 minute');
console.log('========================================\n');

const client = createClient();

setupClient(client, { testMode: true });

client.login(process.env.DISCORD_TOKEN);
