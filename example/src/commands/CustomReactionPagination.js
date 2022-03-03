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
    const identifiersResolver = async ({ reaction, paginator }) => {
      let { pageIdentifier = 0 } = paginator.currentIdentifiers;
      switch (reaction.emoji.name) {
        case paginator.emojiList[0]:
          pageIdentifier -= 1;
          break;
        case paginator.emojiList[1]:
          await paginator.message.delete();
          break;
        case paginator.emojiList[2]:
          pageIdentifier += 1;
          break;
      }

      if (pageIdentifier < 0) {
        pageIdentifier = paginator.maxNumberOfPages + (pageIdentifier % paginator.maxNumberOfPages);
      } else if (pageIdentifier >= paginator.maxNumberOfPages) {
        pageIdentifier %= paginator.maxNumberOfPages;
      }
      return { ...paginator.currentIdentifiers, pageIdentifier };
    };
    const reactionPaginator = new ReactionPaginator(interaction, {
      pages,
      emojiList,
      identifiersResolver,
    })
      .on(PaginatorEvents.COLLECT_ERROR, basicErrorHandler)
      .on(PaginatorEvents.PAGINATION_END, basicEndHandler);
    await reactionPaginator.send();
    return reactionPaginator.message;
  },
};
