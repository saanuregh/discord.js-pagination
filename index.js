/**
 * @param  {Message} [msg] Referrence to original message sent by user
 * @param  {MessageEmbed[]} [pages] Array of MessageEmbeds that are to be paginated.
 * @param  {Emoji[]} emojiList EmojiList is the pageturners defaults to ['⏪', '⏩']
 * @param  {Number} timeout Time till the reaction collectors are active, after this you can't change pages (in ms), defaults to 120000
 */
const paginationEmbed = async (msg, pages, emojiList = ['⏪', '⏩'], timeout = 120000) => {
	if (!msg && !msg.channel) throw new Error('Channel is inaccessible.');
	if (!pages) throw new Error('Pages are not given.');
	if (emojiList.length !== 2) throw new Error('Need two emojis.');
	let page = 0;
	const curPage = await msg.channel.send(pages[page].setFooter(`Page ${page + 1} / ${pages.length}`));
	for (const emoji of emojiList) await curPage.react(emoji);
	const reactionCollector = curPage.createReactionCollector({
		filter: (reaction, user) => emojiList.includes(reaction.emoji.name)
			&& !user.bot
			&& user.id === msg.author.id,
		time: timeout
	});
	reactionCollector.on('collect', reaction => {
		reaction.users.remove(msg.author);
		switch (reaction.emoji.name) {
			case emojiList[0]:
				page = page > 0 ? --page : pages.length - 1;
				break;
			case emojiList[1]:
				page = page + 1 < pages.length ? ++page : 0;
				break;
			default:
				break;
		}
		curPage.edit(pages[page].setFooter(`Page ${page + 1} / ${pages.length}`));
	});
	reactionCollector.on('end', () => {
		if (!curPage.deleted) {
			curPage.reactions.removeAll()
		}
	});
	return curPage;
};
module.exports = paginationEmbed;
