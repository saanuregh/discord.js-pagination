'use strict';

const { Util } = require('discord.js');
const ActionRowPaginator = require('./ActionRowPaginator');
const { ButtonPaginatorDefaults } = require('../util/Defaults');

class ButtonPaginator extends ActionRowPaginator {
  constructor(interaction, options) {
    super(interaction, Util.mergeDefault(ButtonPaginatorDefaults, options));

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

  _handleMapPages(options) {
    options.mapPages({
      buttons: options.buttons,
      initialPages: options.initialPages,
      paginator: this,
    });
  }
}

module.exports = ButtonPaginator;
