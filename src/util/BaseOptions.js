'use strict';

class BaseOptions extends null {
  static createDefault() {
    return {
      messageSender: async paginator => {
        await paginator.interaction.editReply(paginator.currentPage);
        return paginator.interaction.fetchReply();
      },
      startingPageIdentifier: 0,
      shouldChangePage: ({ newPageIdentifier, previousPageIdentifier, paginator }) =>
        !paginator.message.deleted && newPageIdentifier !== previousPageIdentifier,
      useCache: true,
      collectorOptions: {
        filter: ({ interaction, paginator }) => interaction.user === paginator.user && !interaction.user.bot,
        idle: 6e4,
      },
    };
  }
}

module.exports = BaseOptions;
