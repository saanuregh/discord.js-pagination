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
    const pageIndexResolver = async ({ interaction, paginator }) => {
      const val = interaction.customId.toLowerCase();
      switch (val) {
        case `${paginator.customIdPrefix}-first-${paginator.customIdSuffix}`:
          return paginator.startingIndex;
        case `${paginator.customIdPrefix}-next-${paginator.customIdSuffix}`:
          return paginator.currentPageIndex + 1;
        case `${paginator.customIdPrefix}-delete-${paginator.customIdSuffix}`:
          await paginator.message.delete();
          break;
        case `${paginator.customIdPrefix}-previous-${paginator.customIdSuffix}`:
          return paginator.currentPageIndex - 1;
        case `${paginator.customIdPrefix}-last-${paginator.customIdSuffix}`:
          return paginator.numberOfPages - 1;
      }

      return paginator.currentPageIndex;

      /* For demonstration, an if-else alternative
			if (val.includes('first'))
				return paginator.startingIndex;
			else if (val.includes('prev'))
				return paginator.currentPageIndex - 1;
			else if (val.includes('delete'))
				await paginator.message.delete();
			else if (val.includes('next'))
				return paginator.currentPageIndex + 1;
			else if (val.includes('last'))
				return paginator.numberOfPages - 1;
			return paginator.currentPageIndex;
			*/
    };

    const buttonPaginator = new ButtonPaginator(interaction, pages, {
      buttons,
      pageIndexResolver,
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
