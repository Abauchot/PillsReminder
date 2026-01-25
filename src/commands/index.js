const { REST, Routes, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const setup = require('./setup');
const setreminder = require('./setreminder');
const myreminder = require('./myreminder');
const testreminder = require('./testreminder');

const commands = [setup, setreminder, myreminder, testreminder];

async function registerCommands(clientId, token) {
    const rest = new REST({ version: '10' }).setToken(token);

    const commandData = commands.map(cmd => cmd.data.toJSON());

    try {
        console.log('Registering slash commands...');
        await rest.put(
            Routes.applicationCommands(clientId),
            { body: commandData }
        );
        console.log('Slash commands registered successfully');
    } catch (error) {
        console.error('Error registering commands:', error);
    }
}

async function handleInteraction(interaction) {
    if (!interaction.isChatInputCommand()) return;

    const command = commands.find(cmd => cmd.data.name === interaction.commandName);

    if (!command) {
        console.error(`Unknown command: ${interaction.commandName}`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`Error executing command ${interaction.commandName}:`, error);
        const reply = {
            content: 'There was an error executing this command.',
            ephemeral: true
        };
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(reply);
        } else {
            await interaction.reply(reply);
        }
    }
}

module.exports = {
    commands,
    registerCommands,
    handleInteraction
};
