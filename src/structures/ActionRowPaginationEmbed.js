const { MessageActionRow } = require('discord.js');
const { Util } = require('discord.js');
const BasePaginationEmbed = require('./BasePaginationEmbed');
const { ActionRowPaginationEmbedDefaults } = require('../util/Defaults');

class ActionRowPaginationEmbed extends BasePaginationEmbed {
	constructor(receivedPrompt, pages, options) {
		super(receivedPrompt, pages,
			Util.mergeDefault(ActionRowPaginationEmbedDefaults, options));
		this.messageActionRow = new MessageActionRow(this.options.messageActionRowOptions);
	}

	getCollectorArgs(args) {
		const [interaction] = args;
		return { interaction, paginator: this };
	}

	async _collectStart(args) {
		await args.interaction.deferUpdate();
		super._collectStart(args);
	}

	_createCollector() {
		return this.message.createMessageComponentCollector(this.collectorFilterOptions);
	}

	get currentPageMessageOptions() {
		return { ...super.currentPageMessageOptions, components: [this.messageActionRow] };
	}

}

module.exports = ActionRowPaginationEmbed;