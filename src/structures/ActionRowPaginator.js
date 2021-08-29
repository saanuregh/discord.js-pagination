'use strict';
const { MessageActionRow, Util } = require('discord.js');
const BasePaginator = require('./BasePaginator');
const { ActionRowPaginatoDrefaults } = require('../util/Defaults');

class ActionRowPaginator extends BasePaginator {
  constructor(interaction, options) {
    super(interaction, Util.mergeDefault(ActionRowPaginatoDrefaults, options));

    if (typeof options.messageActionRows !== 'object' || options.messageActionRows.length === 0) {
      throw new Error('messageActionRows is not defined or is empty');
    }

    Object.defineProperty(this, 'customIdPrefix', { value: this.options.customIdPrefix });
    Object.defineProperty(this, 'customIdSuffix', { value: interaction.id });
    Object.defineProperty(this, 'messageActionRows', { value: [] });

    options.messageActionRows.forEach((messageActionRowData, messageRowIndex) => {
      messageActionRowData.type = 'ACTION_ROW';
      if (messageActionRowData.components) {
        messageActionRowData.components.forEach(component => {
          const { type, customId } = component;
          switch (type) {
            case 'SELECT_MENU':
              component.customId = this._generateCustomId(`select-menu-${messageRowIndex}`);
              break;
            case 'BUTTON':
              component.customId = component.customId
                ? this._generateCustomId(customId)
                : this._generateCustomId(component.label);
              if (!component.style) component.style = 'PRIMARY';
              break;
          }
        });
      }
      this.messageActionRows.push(new MessageActionRow(messageActionRowData));
    });

    if (this.useCache) {
      this.pages.forEach((value, key) => {
        this.pages.set(key, { ...this.messageOptionComponents, ...value });
      });
    }
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

  getMessageActionRow(row = 0) {
    return this.getComponent(row);
  }

  getComponent(row = 0, index = -1) {
    if (row < 0 || row >= this.messageActionRows.length) return null;
    if (index < 0) return this.messageActionRows[row];
    if (index >= this.messageActionRows[row].components.length) return null;
    return this.messageActionRows[row].components[index];
  }

  get messageOptionComponents() {
    return { components: this.messageActionRows };
  }

  _generateCustomId(label) {
    return `${this.customIdPrefix}-${label}-${this.customIdSuffix}`;
  }
}

module.exports = ActionRowPaginator;
