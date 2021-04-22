const paginationEmbed = async (msg, pages, emojiList = ['⏪', '⏩'], timeout = 120000) => {
	if (!msg && !msg.channel) throw new Error('Channel is inaccessible.');
	if (!pages) throw new Error('Pages are not given.');
	if (emojiList.length !== 2) throw new Error('Need two emojis.');
	let page = 0;
	const curPage = await msg.channel.send(pages[page].setFooter(`Page ${page + 1} / ${pages.length}`));
	setTimeout(async()=>{
		await curPage.react(emojiList[0]);
	},1000);

	setTimeout(async()=>{
		await curPage.react(emojiList[1]);
	},3000);


	const reactionCollector = curPage.createReactionCollector(
		(reaction, user) => emojiList.includes(reaction.emoji.name) && !user.bot,
		{ time: timeout }
	);
	reactionCollector.on('collect', reaction => {
		setTimeout(async ()=> {
			reaction.users.remove(msg.author);
		},2000)
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
