const { SlashCommandBuilder } = require('@discordjs/builders');
const { ButtonPaginator } = require('../../../src');
const { pages } = require('../util/Constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('button-pagination')
    .setDescription('Replies with a button based pagination!'),
  async execute(interaction) {
    await interaction.deferReply();
    const buttonPaginator = new ButtonPaginator(interaction, pages);
    await buttonPaginator.send();
    return buttonPaginator.message;
  },
};
