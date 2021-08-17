const { SlashCommandBuilder } = require('@discordjs/builders');
const { PaginatorEvents, ButtonPaginator } = require('../../../src');
const { basicEndHandler, basicErrorHandler, pages } = require('../util/Constants');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('custom-button-pagination')
		.setDescription('Replies with a button based pagination!'),
	async execute(interaction) {
    await interaction.deferReply();

		const buttons = [
			{
				label: 'First',
				emoji: '⏪', 
				style: 'SECONDARY',
			},
			{
				label: 'Previous'
			},
			{
				label: 'Delete',
				style: 'DANGER'
			},
			{
				label: 'Next'
			},
			{
				label: 'Last',
				emoji: '⏩',
				style: 'SECONDARY'
			}
		];

		const pageResolver = async ({ interaction, paginator }) => {
			const val = interaction.customId.toLowerCase();
			console.log("val is: " + val);
			if (val.includes('first'))
				return paginator.startingIndex;
			else if (val.includes('prev'))
				return paginator.currentPageIndex - 1;
			else if (val.includes('delete'))
				await paginator.message.delete();
			else if (val.includes('next'))
				return paginator.currentPageIndex + 1;
			else if (val.includes('last'))
				return paginator.numberOfPages - 1;
			return paginator.currentPageIndex;
		}

    const buttonPaginator = new ButtonPaginator(interaction, pages, {
			buttons, pageResolver
		})
			.on(PaginatorEvents.COLLECT_ERROR, basicErrorHandler)
			.on(PaginatorEvents.PAGINATION_END, basicEndHandler);
    await buttonPaginator.send();
    return await buttonPaginator.message;
	},
};