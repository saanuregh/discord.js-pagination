import { MessageEmbed, Message } from 'discord.js';
/**
 * @name paginationEmbed
 * @description Create a paginiation embed off of a list of embeds
 * @param {Message} msg
 * @param {MessageEmbed[]} pages
 * @returns {int} current page
*/
export async function paginationEmbed(msg, pages, emojiList = ['⏪', '⏩'], timeout = 120000) {
	if (!msg && !msg.channel) throw new Error('Channel is inaccessible.');
	if (!pages) throw new Error('Pages are not given.');
	if (emojiList.length !== 2) throw new Error('Need two emojis.');
	let page = 0;
	const curPage = await msg.channel.send({ embeds: [pages[page].setFooter(`Page ${page + 1} / ${pages.length}`)]});
	for (const emoji of emojiList) await curPage.react(emoji);
	const reactionCollector = curPage.createReactionCollector(
		(reaction, user) => emojiList.includes(reaction.emoji.name) && !user.bot,
		{ time: timeout }
	);
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

/**
 * @name paginateArray
 * @description Turn arr into an array of arrays the size of limit
 * @argument {Array} arr
 * @argument {int} limit
 */
export function paginateArray(arr, limit) {
	let newarray = []
	while(arr.length) {
		newarray.push(arr.splice(0, limit))
	}
	return newarray
}
