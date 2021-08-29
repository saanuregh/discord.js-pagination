'use strict';

const { SlashCommandBuilder } = require('@discordjs/builders');
const { PaginatorEvents, ButtonPaginator } = require('../../../src');
const { basicEndHandler, basicErrorHandler, pages } = require('../util/Constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('custom-button-pagination')
    .setDescription('Replies with a button based pagination!'),
  async execute(interaction) {
    const buttons = [
      {
        label: 'First',
        emoji: '⏪',
        style: 'SECONDARY',
        disabled: true,
      },
      {
        label: 'Previous',
        disabled: true,
      },
      {
        label: 'Delete',
        style: 'DANGER',
        disabled: true,
      },
      {
        label: 'Next',
        disabled: true,
      },
      {
        label: 'Last',
        emoji: '⏩',
        style: 'SECONDARY',
        disabled: true,
      },
    ];

    // eslint-disable-next-line no-shadow
    // eslint-disable-next-line no-shadow
    const pageIdentifierResolver = async ({ interaction, paginator }) => {
      const val = interaction.component.label;
      let newPageIdentifier = paginator.currentPageIdentifier;
      switch (val) {
        case 'first':
          return paginator.startingPageIdentifier;
        case 'next':
          newPageIdentifier = paginator.currentPageIdentifier + 1;
          break;
        case 'delete':
          await paginator.message.delete();
          break;
        case 'previous':
          newPageIdentifier = paginator.currentPageIdentifier - 1;
          break;
        case 'last':
          return paginator.maxNumberOfPages - 1;
      }

      if (newPageIdentifier < 0) {
        newPageIdentifier = paginator.maxNumberOfPages + (newPageIdentifier % paginator.maxNumberOfPages);
      } else if (newPageIdentifier >= paginator.maxNumberOfPages) {
        newPageIdentifier %= paginator.maxNumberOfPages;
      }
      return newPageIdentifier;
    };

    const buttonPaginator = new ButtonPaginator(interaction, {
      pages,
      buttons,
      pageIdentifierResolver,
    })
      .on(PaginatorEvents.PAGINATION_READY, async paginator => {
        for (const actionRow of paginator.messageActionRows) {
          for (const button of actionRow.components) {
            button.disabled = false;
          }
        }
        await paginator.message.edit(paginator.currentPage);
      })
      .on(PaginatorEvents.COLLECT_ERROR, basicErrorHandler)
      .on(PaginatorEvents.PAGINATION_END, basicEndHandler);
    await buttonPaginator.send();
    return buttonPaginator.message;
  },
};
