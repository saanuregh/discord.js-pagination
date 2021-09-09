'use strict';

const { Util } = require('discord.js');
const BaseOptions = require('./BaseOptions');

class ReactionPaginatorOptions extends BaseOptions {
  static createDefault() {
    return Util.mergeDefault(BaseOptions.createDefault(), {
      emojiList: ['⏪', '⏩'],
      collectorOptions: {
        filter: ({ reaction, user, paginator }) =>
          user === paginator.user && paginator.emojiList.includes(reaction.emoji.name) && !user.bot,
      },
      pageIdentifierResolver: ({ reaction, paginator }) => {
        let newPageIdentifier = paginator.currentPageIdentifier;
        switch (reaction.emoji.name) {
          case paginator.emojiList[0]:
            newPageIdentifier -= 1;
            break;
          case paginator.emojiList[1]:
            newPageIdentifier += 1;
            break;
        }
        // The default identifier is a cyclic index.
        if (newPageIdentifier < 0) {
          newPageIdentifier = paginator.maxNumberOfPages + (newPageIdentifier % paginator.maxNumberOfPages);
        } else if (newPageIdentifier >= paginator.maxNumberOfPages) {
          newPageIdentifier %= paginator.maxNumberOfPages;
        }
        return newPageIdentifier;
      },
    });
  }
}

module.exports = ReactionPaginatorOptions;
