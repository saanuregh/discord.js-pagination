'use strict';

const { SlashCommandBuilder } = require('@discordjs/builders');
const { PaginatorEvents, SelectPaginator } = require('../../../src');
const { pages, basicEndHandler, basicErrorHandler } = require('../util/Constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('custom-select-pagination')
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
      messageActionRows: [
        {
          components: [
            {
              disabled: true,
              placeholder: "You're now on page #1",
            },
          ],
        },
      ],
    })
      .on(PaginatorEvents.BEFORE_PAGE_CHANGED, ({ newIdentifiers, paginator }) => {
        // Here we use the BEFORE_PAGE_CHANGED event to update the placeholder text
        paginator.getSelectMenu().placeholder = `You're now on page #${newIdentifiers.pageIdentifier + 1}`;
      })
      .on(PaginatorEvents.PAGINATION_READY, async paginator => {
        selectPaginator.getSelectMenu().disabled = false;
        await paginator.message.edit(paginator.currentPage);
      })
      .on(PaginatorEvents.COLLECT_ERROR, basicErrorHandler)
      .on(PaginatorEvents.PAGINATION_END, basicEndHandler);
    await selectPaginator.send();
    return selectPaginator.message;
  },
};
