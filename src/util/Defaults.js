'use strict';

exports.BasePaginatorDefaults = {
  startingPageIdentifier: 0,
  idle: 6e4,
  shouldChangePage: ({ newPageIdentifier, previousPageIdentifier, paginator }) =>
    !paginator.message.deleted && newPageIdentifier !== previousPageIdentifier,
  messageSender: async paginator => {
    await paginator.interaction.editReply(paginator.currentPageMessageOptions);
    return paginator.interaction.fetchReply();
  },
  mapPages: ({ initialPages, paginator }) => {
    initialPages.forEach((item, index) => {
      paginator.pages.set(index, item);
    });
  },
};

exports.ReactionPaginatorDefaults = {
  ...exports.BasePaginatorDefaults,
  emojiList: ['⏪', '⏩'],
  collectorFilter: ({ reaction, user, paginator }) =>
    user === paginator.user && paginator.emojiList.includes(reaction.emoji.name) && !user.bot,
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
    let newPageIdentifier = paginator.currentPageIdentifier;
    if (val.includes('prev')) newPageIdentifier = paginator.currentPageIdentifier - 1;
    else if (val.includes('next')) newPageIdentifier = paginator.currentPageIdentifier + 1;
    if (newPageIdentifier < 0) {
      newPageIdentifier = paginator.maxNumberOfPages + newPageIdentifier;
    } else if (newPageIdentifier >= paginator.maxNumberOfPages) {
      newPageIdentifier = (paginator.maxNumberOfPages % newPageIdentifier) - 1;
    }
    return newPageIdentifier;
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
