'use strict';

const { mergeDefault, InteractionType } = require('discord.js');
const { ComponentType } = require('discord-api-types/v10');
const BaseOptions = require('./BaseOptions');

class ActionRowPaginatorOptions extends BaseOptions {
  static createDefault() {
    return mergeDefault(BaseOptions.createDefault(), {
      customIdPrefix: 'paginator',
      messageActionRows: [
        {
          type: ComponentType.ActionRow,
          components: [],
        },
      ],
      collectorOptions: {
        filter: ({ interaction, paginator }) =>
          interaction.type === InteractionType.MessageComponent &&
          interaction.component.customId.startsWith(paginator.customIdPrefix) &&
          interaction.user === paginator.user &&
          !interaction.user.bot,
      },
    });
  }
}

module.exports = ActionRowPaginatorOptions;