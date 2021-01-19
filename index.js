/**
 *
 * @param {MessageEmbed[]} pages
 * @param {EmojiIdentifierResolvable[]} emojiList
 * @param {number} currentPageIndex
 * @param {MessageReaction} reaction
 * @returns {number} - the new page index.
 */
const defaultPageResolver = async (_, pages, emojiList, currentPageIndex, reaction) => {
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

const defaultFooterResolver = (currentPageIndex, pagesLength) => `Page ${currentPageIndex + 1} / ${pagesLength}`;

const defaultSendMessage = async (message, pageEmbed) => await message.channel.send(pageEmbed);

const defaultCollectorFilter = (reaction, user, emojiList) => emojiList.includes(reaction.emoji.name) && !user.bot;

/**
 *
 * @param {Message} msg - the message
 * @param {MessageEmbed[]} pages - array of message embeds to use as each page.
 * @param {PaginationOptions} paginationOptions - exposes collector options, provides customization.
 */
const paginationEmbed = async (msg, pages,
	{
		deleteOnEnd = false, useUtil = false,
		emojiList = ['⏪', '⏩'],
		footerResolver = defaultFooterResolver,
		sendMessage = defaultSendMessage,
		collectorFilter = defaultCollectorFilter,
		pageResolver = defaultPageResolver,
		timeout = 120000,
		...rest
	} = {}
) => {
	if (!msg && !msg.channel) throw new Error('Channel is inaccessible.');
	if (!pages) throw new Error('Pages are not given.');
	let page = 0;
	pages[page].setFooter(footerResolver(page, pages.length));
	const curPage = await sendMessage(msg, pages[page]);
	const reactionCollector = curPage.createReactionCollector(
		async (reaction, user) => await collectorFilter(reaction, user, emojiList),
		{ time: timeout, ...rest }
	);
	reactionCollector.on('collect', async (reaction, user) => {
		await reaction.users.remove(user.id);
		const currentPage = page;

		page = await pageResolver(curPage, pages, emojiList, page, reaction);
		if ( !curPage.deleted && currentPage != page && page >= 0 && page < pages.length)
			await curPage.edit(pages[page].setFooter(footerResolver(page, pages.length)));
	});
	reactionCollector.on('end', async () => {
		if (curPage.deletable && deleteOnEnd)
			await curPage.delete();
		else
			curPage.reactions.removeAll();
	});
	for (const emoji of emojiList) await curPage.react(emoji);
	return curPage;
};

module.exports = paginationEmbed;
