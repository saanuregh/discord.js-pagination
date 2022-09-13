const { InteractionType } = require('discord.js');

const isInteractionCommand = interaction =>
  interaction.type === InteractionType.ApplicationCommand;

  module.exports = {
    isInteractionCommand
  };