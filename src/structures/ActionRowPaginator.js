const { MessageActionRow } = require('discord.js');
const BasePaginator = require('./BasePaginator');


class ActionRowPaginator extends BasePaginator {
	constructor(interaction, pages, options) {
		super(interaction, pages, options);
		this._customIdPrefix = this.options.customIdPrefix;
		this._customIdSuffix = interaction.id;
		this.messageActionRow = new MessageActionRow({
			type: 'ACTION_ROW',
			customId: this._getCustomId('action-row')
		});
	}

	_createCollector() {
		return this.message.createMessageComponentCollector(this.collectorFilterOptions);
	}

	getCollectorArgs(args) {
		const [interaction] = args;
		return { interaction, paginator: this };
	}

	async _collectorFilter(...args) {
		const [interaction] = args;
		if (interaction.customId.startsWith(this.customIdPrefix)
			&& interaction.customId.endsWith(this.customIdSuffix))
			return await super._collectorFilter(...args);
		return false;
	}

	async _collectStart(args) {
		await args.interaction.deferUpdate();
		super._collectStart(args);
	}

	get currentPageMessageOptions() {
		return { ...super.currentPageMessageOptions, components: [this.messageActionRow] };
	}

	get customIdPrefix() {
		return this._customIdPrefix;
	}

	get customIdSuffix() {
		return this._customIdSuffix;
	}

	_getCustomId(label) {
		return `${this.customIdPrefix}-${label}-${this.customIdSuffix}`;
	}
}

module.exports = ActionRowPaginator;