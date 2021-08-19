'use strict';

exports.BasePaginatorDefaults = {
  startingIndex: 0,
  idle: 6e4,
  shouldChangePage: ({ newPageIndex, previousPageIndex, paginator }) =>
    !paginator.message.deleted && newPageIndex !== previousPageIndex,
  footerResolver: paginator => `Page ${paginator.currentPageIndex + 1} / ${paginator.numberOfPages}`,
  messageSender: async paginator => {
    await paginator.interaction.editReply(paginator.currentPageMessageOptions);
    return paginator.interaction.fetchReply();
  },
  mapPages: ({ pagesMap, pagesCache }) => {
    for (const i in pagesMap) {
      pagesCache.set(i, pagesMap[i]);
    }
  },
};

exports.ReactionPaginatorDefaults = {
  ...exports.BasePaginatorDefaults,
  emojiList: ['⏪', '⏩'],
  collectorFilter: ({ reaction, user, paginator }) =>
    user === paginator.user && paginator.emojiList.includes(reaction.emoji.name) && !user.bot,
  pageIndexResolver: ({ reaction, paginator }) => {
    switch (reaction.emoji.name) {
      case paginator.emojiList[0]:
        return paginator.currentPageIndex - 1;
      case paginator.emojiList[1]:
        return paginator.currentPageIndex + 1;
      default:
        return paginator.currentPageIndex;
    }
  },
};

exports.ActionRowPaginatorDefaults = {
  ...exports.BasePaginatorDefaults,
  customIdPrefix: 'paginator',
  collectorFilter: ({ interaction, paginator }) => interaction.user === paginator.user && !interaction.user.bot,
};

exports.ButtonPaginatorDefaults = {
  ...exports.ActionRowPaginatorDefaults,
  buttons: [
    {
      label: 'Previous',
    },
    {
      label: 'Next',
    },
  ],
  pageIndexResolver: ({ interaction, paginator }) => {
    const val = interaction.customId.toLowerCase();
    if (val.includes('prev')) return paginator.currentPageIndex - 1;
    else if (val.includes('next')) return paginator.currentPageIndex + 1;
    return paginator.currentPageIndex;
  },
};

exports.SelectPaginatorDefaults = {
  ...exports.ActionRowPaginatorDefaults,
  mapPages: ({ selectOptions, pages, pagesCache }) => {
    for (const i in pages) {
      pagesCache.set(selectOptions[i].value, pages[i]);
    }
  },
  pageIndexResolver: ({ interaction }) => {
    const [selectedValue] = interaction.values;
    return selectedValue;
  },
};
