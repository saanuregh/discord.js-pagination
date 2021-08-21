'use strict';

const { MessageSelectMenu, Util } = require('discord.js');
const ActionRowPaginator = require('./ActionRowPaginator');
const { SelectPaginatorDefaults } = require('../util/Defaults');

class SelectPaginator extends ActionRowPaginator {
  constructor(interaction, options) {
    super(interaction, Util.mergeDefault(SelectPaginatorDefaults, options));

    if (typeof options.selectOptions === 'undefined' || options.selectOptions.length === 0) {
      throw new Error('selectOptions is undefined or empty, must be a list of MessageSelectOptions');
    }

    this.messageActionRow.addComponents(
      new MessageSelectMenu({
        customId: this._generateCustomId('select-menu'),
        placeholder: options.placeholder,
        minValues: 1,
        maxValues: 1,
      }),
    );

    for (const selectMenuOption of this.options.selectOptions) {
      if (selectMenuOption.customId && !selectMenuOption.customId.startsWith(this.customIdPrefix)) {
        selectMenuOption.customId = this._generateCustomId(selectMenuOption.customId);
      } else {
        selectMenuOption.customId = this._generateCustomId('select-option');
      }
    }

    this.selectMenu.addOptions(this.options.selectOptions);
  }

  get selectMenu() {
    return this.messageActionRow.components[0];
  }
}

module.exports = SelectPaginator;
