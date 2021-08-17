'use strict';

const { MessageSelectMenu, Util } = require('discord.js');
const ActionRowPaginator = require('./ActionRowPaginator');
const { SelectPaginatorDefaults } = require('../util/Defaults');

class SelectPaginator extends ActionRowPaginator {
  constructor(interaction, pages, options) {
    super(interaction, pages, Util.mergeDefault(SelectPaginatorDefaults, options));
    this.messageActionRow.addComponents(
      new MessageSelectMenu({
        customId: this._getCustomId('select-menu'),
        placeholder: options.placeholder,
        minValues: 1,
        maxValues: 1,
      }),
    );

    for (const selectMenuOption of this.options.selectOptions) {
      if (selectMenuOption.customId && !selectMenuOption.customId.startsWith(this.customIdPrefix)) {
        selectMenuOption.customId = this._getCustomId(selectMenuOption.customId);
      } else {
        selectMenuOption.customId = this._getCustomId('select-option');
      }
    }

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
