const { Util } = require('discord.js');
const ActionRowPaginationEmbed = require('./ActionRowPaginationEmbed');
const { ButtonPaginationEmbedDefaults } = require('../util/Defaults');

class SelectPaginationEmbed extends ActionRowPaginationEmbed {

	constructor(interaction, pages, options) {
		super(interaction, pages,
			Util.mergeDefault(ButtonPaginationEmbedDefaults, options));

		for (const button of this.options.buttons) {
			if (button.customId)
				button.customId = this._getCustomId(button.customId);
			else
				button.customId = this._getCustomId(button.label);

			if (!button.type)
				button.type = 'BUTTON';

			if (!button.style)
				button.style = 'PRIMARY';
		}

		this.messageActionRow.addComponents(this.options.buttons);
	}
}

module.exports = SelectPaginationEmbed;