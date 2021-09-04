'use strict';

const { Util } = require('discord.js');

exports.BasePaginatorDefaults = {
  startingPageIdentifier: 0,
  collectorOptions: {
    idle: 6e4,
  },
  useCache: true,
  shouldChangePage: ({ newPageIdentifier, previousPageIdentifier, paginator }) =>
    !paginator.message.deleted && newPageIdentifier !== previousPageIdentifier,
  messageSender: async paginator => {
    await paginator.interaction.editReply(paginator.currentPage);
    return paginator.interaction.fetchReply();
  },
};

exports.ReactionPaginatorDefaults = Util.mergeDefault(exports.BasePaginatorDefaults, {
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

exports.ActionRowPaginatoDrefaults = Util.mergeDefault(exports.BasePaginatorDefaults, {
  customIdPrefix: 'paginator',
  messageActionRows: [
    {
      type: 'ACTION_ROW',
      components: [],
    },
  ],
  collectorOptions: {
    filter: ({ interaction, paginator }) => interaction.user === paginator.user && !interaction.user.bot,
  },
});

exports.ButtonPaginatorDefaults = {
  buttons: [
    {
      label: 'Previous',
    },
    {
      label: 'Next',
    },
  ],
  pageIdentifierResolver: ({ interaction, paginator }) => {
    const val = interaction.component.label.toLowerCase();
    let newPageIdentifier = paginator.currentPageIdentifier;
    if (val === 'previous') newPageIdentifier = paginator.currentPageIdentifier - 1;
    else if (val === 'next') newPageIdentifier = paginator.currentPageIdentifier + 1;
    // The default identifier is a cyclic index.
    if (newPageIdentifier < 0) {
      newPageIdentifier = paginator.maxNumberOfPages + (newPageIdentifier % paginator.maxNumberOfPages);
    } else if (newPageIdentifier >= paginator.maxNumberOfPages) {
      newPageIdentifier %= paginator.maxNumberOfPages;
    }
    return newPageIdentifier;
  },
};

exports.SelectPaginatorDefaults = {
  messageActionRows: [
    {
      components: [
        {
          type: 'SELECT_MENU',
        },
      ],
    },
  ],
  pageIdentifierResolver: ({ interaction }) => {
    const [selectedValue] = interaction.values;
    return parseInt(selectedValue);
  },
};
