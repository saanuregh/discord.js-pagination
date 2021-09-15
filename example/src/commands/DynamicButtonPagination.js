'use strict';

const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { PaginatorEvents, ButtonPaginator } = require('../../../src');
const { basicEndHandler, basicErrorHandler } = require('../util/Constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dynamic-button-pagination')
    .setDescription('Replies with a dynamic button based pagination!'),
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

    const pageEmbedResolver = ({ newIdentifiers, paginator }) => {
      const newPageEmbed = new MessageEmbed();
      newPageEmbed
        .setTitle(`This embed is index ${newIdentifiers.pageIdentifier}!`)
        .setDescription(`That means it is page #${newIdentifiers.pageIdentifier + 1}`);
      newPageEmbed.setFooter(`Page ${newIdentifiers.pageIdentifier + 1} / ${paginator.maxNumberOfPages}`);
      return newPageEmbed;
    };

    const buttonPaginator = new ButtonPaginator(interaction, {
      buttons,
      identifiersResolver,
      pageEmbedResolver,
      maxNumberOfPages: 10,
    })
      .on(PaginatorEvents.PAGINATION_READY, async paginator => {
        for (const button of paginator.getMessageActionRow(0).components) {
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
