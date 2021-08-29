'use strict';

const { Util } = require('discord.js');
const ActionRowPaginator = require('./ActionRowPaginator');
const { SelectPaginatorDefaults } = require('../util/Defaults');

class SelectPaginator extends ActionRowPaginator {
  constructor(interaction, options) {
    super(interaction, Util.mergeDefault(SelectPaginatorDefaults, options));
    if (this.options.selectOptions) {
      const actionRows = [[]];
      this.options.selectOptions.forEach(selectOption => {
        const rowIndex = selectOption.row ? selectOption.row : 0;
        if (rowIndex >= 0 && rowIndex < actionRows.length) {
          actionRows[rowIndex].push(selectOption);
        } else {
          actionRows[0].push(selectOption);
        }
      });
      actionRows.forEach((selectOptions, index) => {
        this.messageActionRows[index].components[0].addOptions(selectOptions);
      });
    }
  }

  getSelectMenu(row = 0) {
    return this.getMessageActionRow(row).components[0];
  }
}

module.exports = SelectPaginator;
