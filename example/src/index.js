'use strict';

const fs = require('fs');
const path = require('path');
const { Client, Intents, Collection } = require('discord.js');
const config = require('../config');

process.on('uncaughtException', err => {
  console.log('UNCAUGHT EXCEPTION:\n');
  console.log(err);
});

const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS],
});

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
const commands = [];

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  // Set a new item in the Collection
  // with the key as the command name and the value as the exported module
  client.commands.set(command.data.name, command);
  commands.push(command.data.toJSON());
}

client.once('ready', () => {
  console.log('Ready!');
  try {
    console.log('Started refreshing application (/) commands.');
    for (const guild of client.guilds.cache.values()) {
      guild.commands
        .fetch()
        .then(guildCommands => {
          if (guildCommands.size === 0) {
            return guild.commands.set(commands);
          } else {
            for (const command of commands) {
              if (!guildCommands.some(val => val.name === command.name)) {
                guild.commands.create(command).then(createdCommand => {
                  console.log(`Created ${createdCommand.name} for ${guild.id}`);
                });
              }
            }

            return guildCommands;
          }
        })
        .catch(error => {
          console.log(`Error while fetching guild commands... ${guild.id}`);
          console.log(error);
        });
    }

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (!client.commands.has(commandName)) return;

  try {
    await interaction.deferReply({ ephemeral: true });
    await client.commands.get(commandName).execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
  }
});

client.login(config.BOT_TOKEN);
