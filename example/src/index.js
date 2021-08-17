const path = require('path');
const fs = require('fs');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { Client, Intents, Collection } = require('discord.js');
const config = require('../config');

process.on('uncaughtException', function(err) {
	console.log('UNCAUGHT EXCEPTION:\n');
	console.log(err);
});

const client = new Client({
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_MESSAGES,
		Intents.FLAGS.GUILD_MESSAGE_REACTIONS
	]
});

client.commands = new Collection();

const commandFiles = fs.readdirSync(path.join(__dirname, '/commands')).filter(file => file.endsWith('.js'));
const commands = [];

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	// set a new item in the Collection
	// with the key as the command name and the value as the exported module
	client.commands.set(command.data.name, command);
	commands.push(command.data.toJSON());
}

const rest = new REST({ version: '9' }).setToken(config.BOT_TOKEN);

client.once('ready', () => {
	console.log('Ready!');
	(async () => {
		try {
			console.log('Started refreshing application (/) commands.');
	
			await rest.put(
				Routes.applicationGuildCommands(config.CLIENT_ID, config.GUILD_ID),
				{ body: commands },
			);
	
			console.log('Successfully reloaded application (/) commands.');
		} catch (error) {
			console.error(error);
		}
	})();
});

client.on('interactionCreate', async (interaction) => {
	if (!interaction.isCommand()) return;

	const { commandName } = interaction;

	if (!client.commands.has(commandName)) return;

	try {
		await client.commands.get(commandName).execute(interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});

client.login(config.BOT_TOKEN);