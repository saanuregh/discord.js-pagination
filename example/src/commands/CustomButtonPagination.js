'use strict';

const { SlashCommandBuilder } = require('@discordjs/builders');
const { ButtonStyle } = require('discord.js');
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
        style: ButtonStyle.Secondary,
        disabled: true,
      },
      {
        label: 'Previous',
        disabled: true,
      },
      {
        label: 'Delete',
        style: ButtonStyle.Danger,
        disabled: true,
      },
      {
        label: 'Next',
        disabled: true,
      },
      {
        label: 'Last',
        emoji: '⏩',
        style: ButtonStyle.Secondary,
        disabled: true,
      },
    ];

    // eslint-disable-next-line no-shadow
    const identifiersResolver = async ({ interaction, paginator }) => {
      const val = interaction.component.label.toLowerCase();
      let { pageIdentifier } = paginator.currentIdentifiers;
      switch (val) {
        case 'first':
          return paginator.initialIdentifiers;
        case 'next':
          pageIdentifier += 1;
          break;
        case 'delete':
          await paginator.message.delete();
          break;
        case 'previous':
          pageIdentifier -= 1;
          break;
        case 'last':
          pageIdentifier = paginator.maxNumberOfPages - 1;
      }

      if (pageIdentifier < 0) {
        pageIdentifier = paginator.maxNumberOfPages + (pageIdentifier % paginator.maxNumberOfPages);
      } else if (pageIdentifier >= paginator.maxNumberOfPages) {
        pageIdentifier %= paginator.maxNumberOfPages;
      }
      return { ...paginator.currentIdentifiers, pageIdentifier };
    };

    const buttonPaginator = new ButtonPaginator(interaction, {
      pages,
      buttons,
      identifiersResolver,
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
