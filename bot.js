const { createClient, setupClient } = require('./src/client');

const client = createClient();

setupClient(client, { testMode: false });

client.login(process.env.DISCORD_TOKEN);
