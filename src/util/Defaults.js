exports.BasePaginationDefaults = {
	startingIndex: 0,
	idle: 6e4,
	shouldChangePage: ({ newPageIndex, previousPageIndex, paginator }) =>
		!paginator.message.deleted && newPageIndex !== previousPageIndex,
	footerResolver: (paginator) => `Page ${paginator.currentPageIndex + 1} / ${paginator.numberOfPages}`,
	messageSender: (paginator) => paginator.channel.send(paginator.currentPageMessageOptions)
};

exports.ReactionPaginationDefaults = {
	...exports.BasePaginationDefaults,
	emojiList: ['⏪', '⏩'],
	collectorFilter: ({ reaction, user, paginator }) =>
		user === paginator.user && paginator.emojiList.includes(reaction.emoji.name) && !user.bot,
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
	customIdPrefix: 'pagination',
	collectorFilter: ({ interaction, paginator }) =>
		interaction.user === paginator.user && !interaction.user.bot
};

exports.ButtonPaginationEmbedDefaults = {
	...exports.ActionRowPaginationEmbedDefaults,
	buttons: [
		{
			label: 'Previous',
			style: 'PRIMARY'
		},
		{
			label: 'Next',
			style: 'PRIMARY'
		}
	],
	pageResolver: ({ interaction, paginator }) => {
		const val = interaction.customId.toLowerCase();
		if (val.includes('prev'))
			return paginator.currentPageIndex - 1;
		else if (val.includes('next'))
			return paginator.currentPageIndex + 1;
		return paginator.currentPageIndex;
	}
};

exports.SelectPaginationEmbedDefaults = {
	...exports.ActionRowPaginationEmbedDefaults,
	messageActionRowOptions: {
		type: 'ACTION_ROW'
	},
	pagesMap: ({ selectMenuOptions, paginator }) => {
		const pagesMap = {};
		for (let i = 0; i < paginator.numberOfPages; i++)
			pagesMap[selectMenuOptions[i].value] = i;
		return pagesMap;
	},
	pageResolver: ({ interaction, paginator }) => {
		const [selectedValue] = interaction.values;
		return paginator.pagesMap[selectedValue];
	}
};