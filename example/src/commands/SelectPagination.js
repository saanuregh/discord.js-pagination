const { SlashCommandBuilder } = require('@discordjs/builders');
const { SelectPaginationEmbed } = require('../../../src');
const { messageSender, pages } = require('../util/Constants');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('select-pagination')
		.setDescription('Replies with a select menu based pagination!'),
	async execute(interaction) {
    await interaction.deferReply();
    const selectOptions = [];
    for (let i = 0; i < 10; i++)
      selectOptions.push({
        label: `"Page #${i + 1}`,
        value: `${i}`,
        description: 'This will take you to page#' + i
      });
    const selectPaginationEmbed = new SelectPaginationEmbed(interaction, pages, {
      selectOptions: selectOptions
    });
    await selectPaginationEmbed.send();
    return await selectPaginationEmbed.message;
	},
};