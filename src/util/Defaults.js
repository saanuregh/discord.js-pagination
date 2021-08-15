exports.BasePaginationDefaults = {
	startingIndex: 0,
	idle: 10e3,
	shouldChangePage: ({ newPageIndex, previousPageIndex, paginator }) =>
		!paginator.message.deleted && newPageIndex !== previousPageIndex,
	footerResolver: (paginator) => `Page ${paginator.currentPageIndex + 1} / ${paginator.numberOfPages}`,
	messageSender: (receivedPrompt, currentPageMessageOptions) => receivedPrompt.channel.send(currentPageMessageOptions)
};

exports.ReactionPaginationDefaults = {
	...exports.BasePaginationDefaults,
	emojiList: ['⏪', '⏩'],
	collectorFilter: ({ reaction, user, paginator }) =>
		user === paginator.receivedPrompt.author && paginator.emojiList.includes(reaction.emoji.name) && !user.bot,
	pageResolver: ({ reaction, paginator }) => {
		switch (reaction.emoji.name) {
			case paginator.emojiList[0]:
				return paginator.currentPageIndex - 1;
			case paginator.emojiList[1]:
				return paginator.currentPageIndex + 1;
			default:
				return paginator.currentPageIndex;
		}
	}
};

exports.ActionRowPaginationEmbedDefaults = {
	...exports.BasePaginationDefaults,
	messageActionRowOptions: {
		type: 'ACTION_ROW',
		components: [
			{
				type: 'BUTTON',
				label: 'Previous',
				customId: 'prev',
				style: 'PRIMARY'
			},
			{
				type: 'BUTTON',
				label: 'Next',
				customId: 'next',
				style: 'PRIMARY'
			}
		]
	},
	collectorFilter: ({ interaction, paginator }) => interaction.user === paginator.receivedPrompt.author && !paginator.receivedPrompt.bot,
	pageResolver: ({ interaction, paginator }) => {
		switch (interaction.customId) {
			case 'prev':
				return paginator.currentPageIndex - 1;
			case 'next':
				return paginator.currentPageIndex + 1;
		}
	}
};