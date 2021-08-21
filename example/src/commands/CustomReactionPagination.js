'use strict';

const { SlashCommandBuilder } = require('@discordjs/builders');
const { PaginatorEvents, ReactionPaginator } = require('../../../src');
const { basicErrorHandler, basicEndHandler, pages } = require('../util/Constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('custom-react-pagination')
    .setDescription('Replies with a custom reaction based pagination!'),
  async execute(interaction) {
    await interaction.deferReply();
    const emojiList = ['⏪', '❌', '⏩'];
    const pageResolver = async ({ reaction, paginator }) => {
      switch (reaction.emoji.name) {
        case paginator.emojiList[0]:
          return paginator.currentPageIndex + 1;
        case paginator.emojiList[1]:
          await paginator.message.delete();
          break;
        case paginator.emojiList[2]:
          return paginator.currentPageIndex - 1;
      }
      return paginator.currentPageIndex;
    };
    const reactionPaginator = new ReactionPaginator(interaction, pages, {
      emojiList,
      pageResolver,
    })
      .on(PaginatorEvents.COLLECT_ERROR, basicErrorHandler)
      .on(PaginatorEvents.PAGINATION_END, basicEndHandler);
    await reactionPaginator.send();
    return reactionPaginator.message;
  },
};
