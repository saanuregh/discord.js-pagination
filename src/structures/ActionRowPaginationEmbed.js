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

	_getCustomId(label) {
		return `${this.customIdPrefix}-${label}-${this.customIdSuffix}`;
	}

	checkInteractionOwnership(interactionId) {
		return interactionId && interactionId.startsWith(this.customIdPrefix) && interactionId.endsWith(this.customIdSuffix);
	}
}

module.exports = ActionRowPaginationEmbed;