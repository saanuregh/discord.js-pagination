'use strict';

class BaseOptions extends null {
  static createDefault() {
    return {
      maxPageCache: 100,
      messageSender: ({ interaction, messageOptions }) => interaction.editReply(messageOptions),
      initialIdentifiers: { pageIdentifier: 0 },
      shouldChangePage: ({ newIdentifiers, currentIdentifiers, paginator }) =>
        paginator.message.deletable && newIdentifiers.pageIdentifier !== currentIdentifiers.pageIdentifier,
      useCache: true,
      collectorOptions: {
        filter: ({ interaction, paginator }) => interaction.user === paginator.user && !interaction.user.bot,
        idle: 6e4,
      },
    };
  }
}

module.exports = BaseOptions;
