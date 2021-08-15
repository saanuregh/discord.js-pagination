const { MessageSelectMenu, Util } = require('discord.js');
const ActionRowPaginationEmbed = require('./ActionRowPaginationEmbed');
const { SelectPaginationEmbedDefaults } = require('../util/Defaults');

class SelectPaginationEmbed extends ActionRowPaginationEmbed {

	constructor(receivedPrompt, pages, options) {
		super(receivedPrompt, pages,
			Util.mergeDefault(SelectPaginationEmbedDefaults, options));
		this.messageActionRow.addComponents(new MessageSelectMenu({
			customId: this._getCustomId('select-menu'),
			minValues: 1,
			maxValues: 1
		}));

		for (const selectMenuOption of this.options.selectMenuOptions)
			if (selectMenuOption.customId && !selectMenuOption.customId.startsWith(this.customIdPrefix))
				selectMenuOption.customId = this._getCustomId(selectMenuOption.customId);
			else
				selectMenuOption.customId = this._getCustomId('select-option');

		this.pagesMap = typeof this.options.pagesMap === 'function' ?
			this.options.pagesMap({ selectMenuOptions: this.options.selectMenuOptions, paginator: this }) : this.options.pagesMap;

		this.selectMenu.addOptions(this.options.selectMenuOptions);
	}

	get selectMenu() {
		return this.messageActionRow.components[0];
	}
}

module.exports = SelectPaginationEmbed;