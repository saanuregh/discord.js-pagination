const defaultInteractables = ['⏪', '⏩'];

const defaultCollectorFilter = ({  reaction, user, interactables }) => interactables.includes(reaction.emoji.name) && !user.bot;

const defaultPageResolver = async ({ reaction, paginator }) => {
	const currentPageIndex = paginator.currentPageIndex;
	let newPageIndex = paginator.currentPageIndex;
	switch (reaction.emoji.name) {
		case paginator.interactables[0]:
			newPageIndex = currentPageIndex > 0 ? currentPageIndex - 1 : paginator.numberOfPages - 1;
			break;
		case paginator.interactables[1]:
			newPageIndex = currentPageIndex + 1 < paginator.numberOfPages ? currentPageIndex + 1 : 0;
			break;
		default:
			return currentPageIndex;
	}
	return newPageIndex;
};

const defaultCollectorEndHandler = async ({ paginator }) => {
	if (!paginator.paginatedEmbedMessage.deleted)
		await paginator.paginatedEmbedMessage.reactions.removeAll();
};

const reactionPaginationEmbedDefaults = { interactables: defaultInteractables, collectorFilter: defaultCollectorFilter, 
  pageResolver: defaultPageResolver, collectorEndHandler: defaultCollectorEndHandler };

module.exports = reactionPaginationEmbedDefaults,
{ defaultInteractables, defaultCollectorFilter, defaultPageResolver, defaultCollectorEndHandler }