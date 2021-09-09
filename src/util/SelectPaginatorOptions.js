'use strict';

const ActionRowPaginatorOptions = require('./ActionRowPaginatorOptions');

class SelectPaginatorOptions extends ActionRowPaginatorOptions {
  static createDefault() {
    return {
      messageActionRows: [
        {
          components: [
            {
              type: 'SELECT_MENU',
            },
          ],
        },
      ],
      pageIdentifierResolver: ({ interaction }) => {
        const [selectedValue] = interaction.values;
        return parseInt(selectedValue);
      },
    };
  }
}

module.exports = SelectPaginatorOptions;
