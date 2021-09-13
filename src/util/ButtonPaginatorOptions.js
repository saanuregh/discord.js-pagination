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
      identifiersResolver: ({ interaction, paginator }) => {
        const val = interaction.component.label.toLowerCase();
        let { pageIdentifier } = paginator.currentIdentifiers;
        if (val === 'previous') pageIdentifier -= 1;
        else if (val === 'next') pageIdentifier += 1;
        // The default identifier is a cyclic index.
        if (pageIdentifier < 0) {
          pageIdentifier = paginator.maxNumberOfPages + (pageIdentifier % paginator.maxNumberOfPages);
        } else if (pageIdentifier >= paginator.maxNumberOfPages) {
          pageIdentifier %= paginator.maxNumberOfPages;
        }
        return { ...paginator.currentIdentifiers, pageIdentifier };
      },
    };
  }
}

module.exports = ButtonPaginatorOptions;
