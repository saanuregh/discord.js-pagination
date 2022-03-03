'use strict';

const { Util } = require('discord.js');
const BaseOptions = require('./BaseOptions');

class ActionRowPaginatorOptions extends BaseOptions {
  static createDefault() {
    return Util.mergeDefault(BaseOptions.createDefault(), {
      customIdPrefix: 'paginator',
      messageActionRows: [
        {
          type: 'ACTION_ROW',
          components: [],
        },
      ],
      collectorOptions: {
        filter: ({ interaction, paginator }) =>
          interaction.isMessageComponent() &&
          interaction.component.customId.startsWith(paginator.customIdPrefix) &&
          interaction.user === paginator.user &&
          !interaction.user.bot,
      },
    });
  }
}

module.exports = ActionRowPaginatorOptions;
