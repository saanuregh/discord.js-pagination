const { Util } = require('discord.js');
const ActionRowPaginator = require('./ActionRowPaginator');
const { ButtonPaginatorDefaults } = require('../util/Defaults');

class SelectPaginator extends ActionRowPaginator {

	constructor(interaction, pages, options) {
		super(interaction, pages,
			Util.mergeDefault(ButtonPaginatorDefaults, options));

		for (const button of this.options.buttons) {
			button.type = 'BUTTON';
			if (button.customId)
				button.customId = this._getCustomId(button.customId);
			else
				button.customId = this._getCustomId(button.label);

			if (!button.style)
				button.style = 'PRIMARY';
		}

		this.messageActionRow.addComponents(this.options.buttons);
	}
}

module.exports = SelectPaginator;