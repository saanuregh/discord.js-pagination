'use strict';

const ActionRowPaginatorOptions = require('./ActionRowPaginatorOptions');

class ButtonPaginatorOptions extends ActionRowPaginatorOptions {
  static createDefault() {
    return {
      customIdPrefix: 'paginator',
      buttons: [
        {
          label: 'Previous',
        },
        {
          label: 'Next',
        },
      ],
      pageIdentifierResolver: ({ interaction, paginator }) => {
        const val = interaction.component.label.toLowerCase();
        let newPageIdentifier = paginator.currentPageIdentifier;
        if (val === 'previous') newPageIdentifier = paginator.currentPageIdentifier - 1;
        else if (val === 'next') newPageIdentifier = paginator.currentPageIdentifier + 1;
        // The default identifier is a cyclic index.
        if (newPageIdentifier < 0) {
          newPageIdentifier = paginator.maxNumberOfPages + (newPageIdentifier % paginator.maxNumberOfPages);
        } else if (newPageIdentifier >= paginator.maxNumberOfPages) {
          newPageIdentifier %= paginator.maxNumberOfPages;
        }
        return newPageIdentifier;
      },
      collectorOptions: {
        filter: ({ interaction, paginator }) => interaction.user === paginator.user && !interaction.user.bot,
      },
    };
  }
}

module.exports = ButtonPaginatorOptions;
