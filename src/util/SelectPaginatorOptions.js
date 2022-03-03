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
      identifiersResolver: ({ interaction, paginator }) => {
        const [selectedValue] = interaction.values;
        return { ...paginator.currentIdentifiers, pageIdentifier: parseInt(selectedValue) };
      },
    };
  }
}

module.exports = SelectPaginatorOptions;
