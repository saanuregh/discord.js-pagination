const { MessageActionRow } = require('discord.js');
const BasePaginationEmbed = require('./BasePaginationEmbed');


class ActionRowPaginationEmbed extends BasePaginationEmbed {
	constructor(receivedPrompt, pages, options) {
		super(receivedPrompt, pages, options);
		this.customIdPrefix = this.options.customIdPrefix;
		this.customIdSuffix = receivedPrompt.id;
		this.messageActionRow = new MessageActionRow({
			type: 'ACTION_ROW',
			customId: this._getCustomId('action-row')
		});
	}

	_createCollector() {
		return this.message.createMessageComponentCollector(this.collectorFilterOptions);
	}

	async _collectStart(args) {
		await args.interaction.deferUpdate();
		super._collectStart(args);
	}

	async _collectorFilter(...args) {
		const [interaction] = args;
		if (interaction.customId.startsWith(this.customIdPrefix)
			&& interaction.customId.endsWith(this.customIdSuffix))
			return await super._collectorFilter(...args);
		return false;
	}

	getCollectorArgs(args) {
		const [interaction] = args;
		return { interaction, paginator: this };
	}

	get currentPageMessageOptions() {
		return { ...super.currentPageMessageOptions, components: [this.messageActionRow] };
	}

	_getCustomId(label) {
		return `${this.customIdPrefix}-${label}-${this.customIdSuffix}`;
	}
}

module.exports = ActionRowPaginationEmbed;