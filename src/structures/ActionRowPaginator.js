'use strict';

const { MessageActionRow } = require('discord.js');
const BasePaginator = require('./BasePaginator');

class ActionRowPaginator extends BasePaginator {
  constructor(interaction, options) {
    super(interaction, options);

    Object.defineProperty(this, 'customIdPrefix', { value: this.options.customIdPrefix });
    Object.defineProperty(this, 'customIdSuffix', { value: interaction.id });
    this.messageActionRow = new MessageActionRow({
      type: 'ACTION_ROW',
      customId: this._generateCustomId('action-row'),
    });
  }

  _createCollector() {
    return this.message.createMessageComponentCollector(this.collectorFilterOptions);
  }

  getCollectorArgs(args) {
    const [interaction] = args;
    return { interaction, paginator: this };
  }

  _collectorFilter(...args) {
    const [interaction] = args;
    if (interaction.customId.startsWith(this.customIdPrefix) && interaction.customId.endsWith(this.customIdSuffix)) {
      return super._collectorFilter(...args);
    }
    return false;
  }

  async _collectStart(args) {
    await args.interaction.deferUpdate();
    super._collectStart(args);
  }

  get currentPageMessageOptions() {
    return { ...super.currentPageMessageOptions, components: [this.messageActionRow] };
  }

  _generateCustomId(label) {
    return `${this.customIdPrefix}-${label}-${this.customIdSuffix}`;
  }
}

module.exports = ActionRowPaginator;
