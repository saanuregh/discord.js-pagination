'use strict';

const { ComponentType } = require('discord-api-types/v10');
const ActionRowPaginatorOptions = require('./ActionRowPaginatorOptions');

class SelectPaginatorOptions extends ActionRowPaginatorOptions {
  static createDefault() {
    return {
      messageActionRows: [
        {
          components: [
            {
              type: ComponentType.SelectMenu,
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

module.exports = ActionRowPaginatorOptions;