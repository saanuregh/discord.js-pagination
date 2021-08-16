const { SlashCommandBuilder } = require('@discordjs/builders');
const { ReactionPaginationEmbed } = require('../../../src');
const { messageSender, pages } = require('../util/Constants');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('react-pagination')
		.setDescription('Replies with a reaction based pagination!'),
	async execute(interaction) {
    await interaction.deferReply();
    const reactionPagination = new ReactionPaginationEmbed(interaction, pages, { messageSender: messageSender });
    await reactionPagination.send();
    return await reactionPagination.message;
	},
};