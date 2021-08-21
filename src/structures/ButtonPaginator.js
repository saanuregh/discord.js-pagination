'use strict';

const { Util } = require('discord.js');
const ActionRowPaginator = require('./ActionRowPaginator');
const { ButtonPaginatorDefaults } = require('../util/Defaults');

class SelectPaginator extends ActionRowPaginator {
  constructor(interaction, pages, options) {
    super(interaction, pages, Util.mergeDefault(ButtonPaginatorDefaults, options));

    if (typeof options.buttons === 'undefined' || options.buttons.length === 0) {
      throw new Error('buttons is undefined or empty, must be a list of MessageButtonOptions');
    }

    for (const button of this.options.buttons) {
      button.type = 'BUTTON';
      if (button.customId) button.customId = this._generateCustomId(button.customId);
      else button.customId = this._generateCustomId(button.label);

      if (!button.style) button.style = 'PRIMARY';
    }

    this.messageActionRow.addComponents(this.options.buttons);
  }
}

module.exports = SelectPaginator;
