/**
 *
 * @param {MessageEmbed[]} pages
 * @param {string[]} emojiList
 * @param {number} currentPageIndex
 * @param {MessageReaction} reaction
 * @returns {number} - the new page index.
 */
const defaultPageResolver = async (pages, emojiList, currentPageIndex, reaction) => {
	let newPage = currentPageIndex;
	switch (reaction.emoji.name) {
		case emojiList[0]:
			newPage = currentPageIndex > 0 ? currentPageIndex - 1 : pages.length - 1;
			break;
		case emojiList[1]:
			newPage = currentPageIndex + 1 < pages.length ? currentPageIndex + 1 : 0;
			break;
		default:
			return currentPageIndex;
	}
	return newPage;
};

const defaultFooterResolver = (currentPageIndex, pagesLength) =>`Page ${currentPageIndex + 1} / ${pagesLength}`;

const defaultCollectorFilter = (reaction, user, emojiList) => emojiList.includes(reaction.emoji.name) && !user.bot;

/**
 *
 * @param {Message} msg - the message
 * @param {MessageEmbed[]} pages - array of message embeds to use as each page.
 * @param {PaginationOptions} paginationOptions - exposes collector options, provides customization.
 */
const paginationEmbed = async (
										msg, pages,
										{
											deleteOnEnd = false, useUtil = false,
											emojiList = ['⏪', '⏩'],
											collectorFilter = defaultCollectorFilter,
											footerResolver = defaultFooterResolver,
											pageResolver = defaultPageResolver,
											timeout = 120000,
											...rest
										} = {}) => {
	if (!msg && !msg.channel) throw new Error('Channel is inaccessible.');
	if (!pages) throw new Error('Pages are not given.');
	let page = 0;
	pages[page].setFooter(footerResolver(page, pages.length));
	const curPage = useUtil ? await msg.util.reply(pages[page]) : await msg.channel.send(pages[page]);
	// This will fail if the message is deleted before the reactions are all added, bail before reactor creation
	try {
		for (const emoji of emojiList) await curPage.react(emoji);
	} catch (error) {
		return curPage;
	}
	const reactionCollector = curPage.createReactionCollector(
		(reaction, user) => collectorFilter(reaction, user, emojiList),
		{ time: timeout, ...rest }
	);
	reactionCollector.on('collect', async (reaction, user) => {
		await reaction.users.remove(user.id);
		page = await pageResolver(pages, emojiList, page, reaction);

		if (page >= 0 && page < pages.length && !curPage.deleted)
			curPage.edit(pages[page].setFooter(footerResolver(page, pages.length)));
	});
	reactionCollector.on('end', async () => {
		if (!curPage.deleted) {
			if (deleteOnEnd)
				await curPage.delete();
			else
				curPage.reactions.removeAll();
		}
	});
	return curPage;
};

module.exports = paginationEmbed;
