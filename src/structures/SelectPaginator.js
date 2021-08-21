'use strict';

const { MessageSelectMenu, Util } = require('discord.js');
const ActionRowPaginator = require('./ActionRowPaginator');
const { SelectPaginatorDefaults } = require('../util/Defaults');

class SelectPaginator extends ActionRowPaginator {
  constructor(interaction, pages, options) {
    super(interaction, pages, Util.mergeDefault(SelectPaginatorDefaults, options));

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

    this.pagesMap =
      typeof this.options.pagesMap === 'function'
        ? this.options.pagesMap({ selectOptions: this.options.selectOptions, paginator: this })
        : this.options.pagesMap;

    this.selectMenu.addOptions(this.options.selectOptions);
  }

  get selectMenu() {
    return this.messageActionRow.components[0];
  }
}

module.exports = SelectPaginator;
