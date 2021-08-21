'use strict';

const { SlashCommandBuilder } = require('@discordjs/builders');
const { PaginatorEvents, ReactionPaginator } = require('../../../src');
const { basicErrorHandler, pages, basicEndHandler } = require('../util/Constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('react-pagination')
    .setDescription('Replies with a reaction based pagination!'),
  async execute(interaction) {
    await interaction.deferReply();
    const reactionPaginator = new ReactionPaginator(interaction, { initialPages: pages })
      .on(PaginatorEvents.COLLECT_ERROR, basicErrorHandler)
      .on(PaginatorEvents.PAGINATION_END, basicEndHandler);
    await reactionPaginator.send();
    return reactionPaginator.message;
  },
};
