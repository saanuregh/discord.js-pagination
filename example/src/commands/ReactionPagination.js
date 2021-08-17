const { SlashCommandBuilder } = require('@discordjs/builders');
const { PaginationEvents, ReactionPaginationEmbed } = require('../../../src');
const { basicErrorHandler, basicEndHandler, messageSender, pages } = require('../util/Constants');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('react-pagination')
		.setDescription('Replies with a reaction based pagination!'),
	async execute(interaction) {
    await interaction.deferReply();
    const reactionPagination = new ReactionPaginationEmbed(interaction, pages,
      { 
        messageSender: messageSender 
      }).on(PaginationEvents.COLLECT_ERROR(basicErrorHandler)).on(PaginationEvents.PAGINATION_END);
    await reactionPagination.send();
    return await reactionPagination.message;
	},
};