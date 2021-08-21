'use strict';

const { SlashCommandBuilder } = require('@discordjs/builders');
const { PaginatorEvents, SelectPaginator } = require('../../../src');
const { pages, basicEndHandler, basicErrorHandler } = require('../util/Constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('custom-select-pagination')
    .setDescription('Replies with a select menu based pagination!'),
  async execute(interaction) {
    await interaction.deferReply();
    const selectOptions = [];
    for (let i = 0; i < 10; i++) {
      selectOptions.push({
        label: `"Page #${i + 1}`,
        value: `${i}`,
        description: `This will take you to page #${i + 1}`,
      });
    }
    const selectPaginator = new SelectPaginator(interaction, {
      initialPages: pages,
      placeholder: "You're now on page #1",
      selectOptions: selectOptions,
    })
      .on(PaginatorEvents.BEFORE_PAGE_CHANGED, ({ newPageIndex, paginator }) => {
        // Here we use the BEFORE_PAGE_CHANGED event to update the placeholder text
        paginator.selectMenu.placeholder = `You're now on page #${newPageIndex + 1}`;
      })
      .on(PaginatorEvents.PAGINATION_READY, async paginator => {
        paginator.selectMenu.disabled = false;
        await paginator.message.edit(paginator.currentPageMessageOptions);
      })
      .on(PaginatorEvents.COLLECT_ERROR, basicErrorHandler)
      .on(PaginatorEvents.PAGINATION_END, basicEndHandler);
    // Disabled the select menu before sending it.
    selectPaginator.selectMenu.disabled = true;
    await selectPaginator.send();
    return selectPaginator.message;
  },
};
