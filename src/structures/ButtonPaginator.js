'use strict';

const { Util } = require('discord.js');
const ActionRowPaginator = require('./ActionRowPaginator');
const ButtonPaginatorOptions = require('../util/ButtonPaginatorOptions');

class ButtonPaginator extends ActionRowPaginator {
  constructor(interaction, options) {
    super(interaction, Util.mergeDefault(ButtonPaginatorOptions.createDefault(), options));
    // Buttons may also be set via the messageActionRows prop.
    if (this.options.buttons) {
      const buttonRows = [[]];
      for (const button of this.options.buttons) {
        button.type = 'BUTTON';
        const isLink = button.url !== undefined;
        if (!isLink) {
          button.customId = button.customId
            ? this._generateCustomId(button.customId)
            : this._generateCustomId(button.label);
        }
        // LINK : PRIMARY - MessageButtonStyles doesn't work.
        if (!button.style) button.style = isLink ? 5 : 1;
        if (button.row > 0 && button.row < buttonRows.length) {
          buttonRows[button.row].push(button);
        } else {
          buttonRows[0].push(button);
        }
      }
      buttonRows.forEach((row, index) => {
        this.messageActionRows[index].addComponents(row);
      });
    }
  }
}

module.exports = ButtonPaginator;
