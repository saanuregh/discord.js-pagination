'use strict';

exports.BasePaginatorDefaults = {
  startingIdentifier: 0,
  idle: 6e4,
  shouldChangePage: ({ newPageIdentifier, previousPageIdentifier, paginator }) =>
    !paginator.message.deleted && newPageIdentifier !== previousPageIdentifier,
  messageSender: async paginator => {
    await paginator.interaction.editReply(paginator.currentPageMessageOptions);
    return paginator.interaction.fetchReply();
  },
  mapPages: ({ initialPages, paginator }) => {
    for (const i in initialPages) {
      paginator.pages.set(i, initialPages[i]);
    }
  },
};

exports.ReactionPaginatorDefaults = {
  ...exports.BasePaginatorDefaults,
  emojiList: ['⏪', '⏩'],
  collectorFilter: ({ reaction, user, paginator }) =>
    user === paginator.user && paginator.emojiList.includes(reaction.emoji.name) && !user.bot,
  pageIdentifierResolver: ({ reaction, paginator }) => {
    switch (reaction.emoji.name) {
      case paginator.emojiList[0]:
        return paginator.currentPageIdentifier - 1;
      case paginator.emojiList[1]:
        return paginator.currentPageIdentifier + 1;
      default:
        return paginator.currentPageIdentifier;
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
  pageIdentifierResolver: ({ interaction, paginator }) => {
    const val = interaction.customId.toLowerCase();
    if (val.includes('prev')) return paginator.currentPageIdentifier - 1;
    else if (val.includes('next')) return paginator.currentPageIdentifier + 1;
    return paginator.currentPageIdentifier;
  },
};

exports.SelectPaginatorDefaults = {
  ...exports.ActionRowPaginatorDefaults,
  mapPages: ({ selectOptions, initialPages, paginator }) => {
    for (const i in initialPages) {
      paginator.pages.set(selectOptions[i].value, initialPages[i]);
    }
  },
  pageIdentifierResolver: ({ interaction }) => {
    const [selectedValue] = interaction.values;
    return selectedValue;
  },
};
