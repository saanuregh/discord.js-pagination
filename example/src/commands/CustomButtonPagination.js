'use strict';

const { SlashCommandBuilder } = require('@discordjs/builders');
const { PaginatorEvents, ButtonPaginator } = require('../../../src');
const { basicEndHandler, basicErrorHandler, pages } = require('../util/Constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('custom-button-pagination')
    .setDescription('Replies with a button based pagination!'),
  async execute(interaction) {
    await interaction.deferReply();

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
    const pageIdentifierResolver = async ({ interaction, paginator }) => {
      const val = interaction.customId.toLowerCase();
      let newPageIdentifier = paginator.currentPageIdentifier;
      switch (val) {
        case `${paginator.customIdPrefix}-first-${paginator.customIdSuffix}`:
          return paginator.startingPageIdentifier;
        case `${paginator.customIdPrefix}-next-${paginator.customIdSuffix}`:
          newPageIdentifier = paginator.currentPageIdentifier + 1;
          break;
        case `${paginator.customIdPrefix}-delete-${paginator.customIdSuffix}`:
          await paginator.message.delete();
          break;
        case `${paginator.customIdPrefix}-previous-${paginator.customIdSuffix}`:
          newPageIdentifier = paginator.currentPageIdentifier - 1;
          break;
        case `${paginator.customIdPrefix}-last-${paginator.customIdSuffix}`:
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
      initialPages: pages,
      buttons,
      pageIdentifierResolver,
    })
      .on(PaginatorEvents.PAGINATION_READY, async paginator => {
        for (const button of paginator.messageActionRow.components) {
          button.disabled = false;
        }
        await paginator.message.edit(paginator.currentPageMessageOptions);
      })
      .on(PaginatorEvents.COLLECT_ERROR, basicErrorHandler)
      .on(PaginatorEvents.PAGINATION_END, basicEndHandler);
    await buttonPaginator.send();
    return buttonPaginator.message;
  },
};
