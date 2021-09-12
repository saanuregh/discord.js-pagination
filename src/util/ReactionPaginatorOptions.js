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
      identifiersResolver: ({ reaction, paginator }) => {
        let { pageIdentifier } = paginator.currentIdentifiers;
        switch (reaction.emoji.name) {
          case paginator.emojiList[0]:
            pageIdentifier -= 1;
            break;
          case paginator.emojiList[1]:
            pageIdentifier += 1;
            break;
        }
        // The default identifier is a cyclic index.
        if (pageIdentifier < 0) {
          pageIdentifier = paginator.maxNumberOfPages + (pageIdentifier % paginator.maxNumberOfPages);
        } else if (pageIdentifier >= paginator.maxNumberOfPages) {
          pageIdentifier %= paginator.maxNumberOfPages;
        }
        return { ...paginator.currentIdentifiers, pageIdentifier };
      },
    });
  }
}

module.exports = ReactionPaginatorOptions;
