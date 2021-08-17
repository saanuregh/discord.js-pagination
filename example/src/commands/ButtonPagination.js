const { SlashCommandBuilder } = require('@discordjs/builders');
const { ButtonPaginationEmbed } = require('../../../src');
const { messageSender, pages } = require('../util/Constants');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('button-pagination')
		.setDescription('Replies with a button based pagination!'),
	async execute(interaction) {
    await interaction.deferReply();
    const reactionPagination = new ButtonPaginationEmbed(interaction, pages);
    await reactionPagination.send();
    return await reactionPagination.message;
	},
};