'use strict';

const { SlashCommandBuilder } = require('@discordjs/builders');
const { PaginatorEvents, ReactionPaginator } = require('../../../src');
const { basicErrorHandler, basicEndHandler, pages } = require('../util/Constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('custom-react-pagination')
    .setDescription('Replies with a custom reaction based pagination!'),
  async execute(interaction) {
    const emojiList = ['⏪', '❌', '⏩'];
    const pageIdentifierResolver = async ({ reaction, paginator }) => {
      let newPageIdentifier = paginator.currentPageIdentifier;
      switch (reaction.emoji.name) {
        case paginator.emojiList[0]:
          newPageIdentifier -= 1;
          break;
        case paginator.emojiList[1]:
          await paginator.message.delete();
          break;
        case paginator.emojiList[2]:
          newPageIdentifier += 1;
          break;
      }

      if (newPageIdentifier < 0) {
        newPageIdentifier = paginator.maxNumberOfPages + (newPageIdentifier % paginator.maxNumberOfPages);
      } else if (newPageIdentifier >= paginator.maxNumberOfPages) {
        newPageIdentifier %= paginator.maxNumberOfPages;
      }
      return newPageIdentifier;
    };
    const reactionPaginator = new ReactionPaginator(interaction, {
      pages,
      emojiList,
      pageIdentifierResolver,
    })
      .on(PaginatorEvents.COLLECT_ERROR, basicErrorHandler)
      .on(PaginatorEvents.PAGINATION_END, basicEndHandler);
    await reactionPaginator.send();
    return reactionPaginator.message;
  },
};
