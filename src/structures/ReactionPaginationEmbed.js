const { Util } = require('discord.js');
const BasePaginationEmbed = require('./BasePaginationEmbed');
const { ReactionPaginationDefaults } = require('../util/Defaults');

class ReactionPaginationEmbed extends BasePaginationEmbed {
	constructor(receivedPrompt, pages, options) {
		super(receivedPrompt, pages,
			Util.mergeDefault(ReactionPaginationDefaults, options));

		this.emojiList = this.options.emojiList;
	}

	_createCollector() {
		return this.message.createReactionCollector(this.collectorFilterOptions);
	}

	getCollectorArgs(args) {
		const [ reaction, user ] = args;
		return { reaction, user, paginator: this };
	}

	async _preSetup() {
		super._preSetup();
		if (!this.emojiList)
			throw new Error('emojiList is empty or undefined');
	}

	async _postSetup() {
		for (const emoji of this.emojiList)
			await this.message.react(emoji);
	}

	async _collectStart(args) {
		super._collectStart();
		await args.reaction.users.remove(this.receivedPrompt.author);
	}
}

module.exports = ReactionPaginationEmbed;
