'use strict';

const { SlashCommandBuilder } = require('@discordjs/builders');
const { PaginatorEvents, SelectPaginator } = require('../../../src');
const { basicEndHandler, basicErrorHandler, pages } = require('../util/Constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('select-pagination')
    .setDescription('Replies with a select menu based pagination!'),
  async execute(interaction) {
    const selectOptions = [];
    for (let i = 0; i < 10; i++) {
      selectOptions.push({
        label: `"Page #${i + 1}`,
        value: `${i}`,
        description: `This will take you to page #${i + 1}`,
      });
    }
    const selectPaginator = new SelectPaginator(interaction, {
      pages,
      selectOptions: selectOptions,
    })
      .on(PaginatorEvents.COLLECT_ERROR, basicErrorHandler)
      .on(PaginatorEvents.PAGINATION_END, basicEndHandler);
    await selectPaginator.send();
    return selectPaginator.message;
  },
};
