const { Util } = require('discord.js');
const BasePaginator = require('./BasePaginator');
const { ReactionPaginatorDefaults } = require('../util/Defaults');

class ReactionPaginator extends BasePaginator {
	constructor(interaction, pages, options) {
		super(interaction, pages,
			Util.mergeDefault(ReactionPaginatorDefaults, options));

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
		super._postSetup();
	}

	async _collectStart(args) {
		super._collectStart(args);
		await args.reaction.users.remove(args.user);
	}
}

module.exports = ReactionPaginator;
