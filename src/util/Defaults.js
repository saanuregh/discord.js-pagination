exports.BasePaginationDefaults = {
	startingIndex: 0,
	idle: 10e3,
	shouldChangePage: ({ previousPageIndex, paginator }) =>
		paginator.validateChangePage() && previousPageIndex !== paginator.currentPageIndex,
	footerResolver: (paginator) => `Page ${paginator.currentPageIndex + 1} / ${paginator.numberOfPages}`,
	messageSender: async (receivedPrompt, currentPage) => await receivedPrompt.channel.send({ embeds: [currentPage] })
};

exports.ReactionPaginationDefaults = {
	...exports.BasePaginationDefaults,
	emojiList: ['⏪', '⏩'],
	collectorFilter: ({ reaction, user, paginator }) => paginator.emojiList.includes(reaction.emoji.name) && !user.bot,
	pageResolver: async ({ reaction, paginator }) => {
		let newPageIndex = 0;
		switch (reaction.emoji.name) {
			case paginator.emojiList[0]:
				newPageIndex = paginator.currentPageIndex > 0
					? paginator.currentPageIndex - 1 : paginator.numberOfPages - 1;
				break;
			case paginator.emojiList[1]:
				newPageIndex = paginator.currentPageIndex + 1 < paginator.numberOfPages
					? paginator.currentPageIndex + 1 : 0;
				break;
			default:
				return paginator.previousPageIndex;
		}
		return newPageIndex;
	},
	collectorEndHandler: async ({ paginator }) => {
		if (!paginator.paginatedEmbedMessage.deleted)
			await paginator.paginatedEmbedMessage.reactions.removeAll();
	}
};