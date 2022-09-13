'use strict';
const { ActionRowBuilder, mergeDefault, ButtonStyle } = require('discord.js');
const { ComponentType } = require('discord-api-types/v10');
const BasePaginator = require('./BasePaginator');
const ActionRowPaginatorOptions = require('../util/ActionRowPaginatorOptions');

class ActionRowPaginator extends BasePaginator {
  constructor(interaction, options) {
    super(interaction, mergeDefault(ActionRowPaginatorOptions.createDefault(), options));

    if (typeof options.messageActionRows !== 'object' || options.messageActionRows.length === 0) {
      throw new Error('messageActionRows is not defined or is empty');
    }

    Object.defineProperty(this, 'customIdPrefix', { value: this.options.customIdPrefix });
    Object.defineProperty(this, 'customIdSuffix', { value: interaction.id });
    Object.defineProperty(this, 'messageActionRows', { value: [] });

    options.messageActionRows.forEach((messageActionRowData, messageRowIndex) => {
      messageActionRowData.type = ComponentType.ActionRow;
      if (messageActionRowData.components) {
        messageActionRowData.components.forEach(component => {
          const { type, customId } = component;
          switch (type) {
            case ComponentType.SelectMenu:
              component.customId = component.customId
                ? this._generateCustomId(component.customId)
                : this._generateCustomId(`select-menu-${messageRowIndex}`);
              break;
            case ComponentType.Button:
              component.customId = component.customId
                ? this._generateCustomId(customId)
                : this._generateCustomId(component.label);
              if (!component.style) component.style = ButtonStyle.Primary;
              break;
          }
        });
      }
      this.messageActionRows.push(new ActionRowBuilder(messageActionRowData));
    });

    if (this.useCache) {
      this.pages.forEach((value, key) => {
        this.pages.set(key, { ...this.messageOptionComponents, ...value });
      });
    }
  }

  _createCollector() {
    return this.message.createMessageComponentCollector(this.collectorOptions);
  }

  getCollectorArgs(args) {
    const [interaction] = args;
    return super.getCollectorArgs({ interaction });
  }

  _collectorFilter(interaction) {
    if (interaction.customId.startsWith(this.customIdPrefix) && interaction.customId.endsWith(this.customIdSuffix)) {
      return super._collectorFilter(interaction);
    }
    return false;
  }

  async _collectStart(args) {
    await args.interaction.deferUpdate();
    super._collectStart(args);
  }

  editMessage({ changePageArgs, messageOptions }) {
    return changePageArgs.collectorArgs.interaction.editReply(messageOptions);
  }

  async _resolveMessageOptions({ changePageArgs }) {
    const messageOptions = await super._resolveMessageOptions({
      messageOptions: this.messageOptionComponents,
      changePageArgs,
    });
    return messageOptions;
  }

  getMessageActionRow(row = 0) {
    return this.getComponent(row);
  }

  getComponent(row = 0, index = -1) {
    if (
      typeof this.currentPageMessageOptions === 'undefined' ||
      row < 0 ||
      row >= this.currentPageMessageOptions.components.length
    ) {
      return null;
    }
    if (index < 0) return this.currentPageMessageOptions.components[row];
    if (index >= this.currentPageMessageOptions.components[row].components.length) return null;
    return this.currentPageMessageOptions.components[row].components[index];
  }

  get messageOptionComponents() {
    return { components: this.messageActionRows };
  }

  _generateCustomId(label) {
    return `${this.customIdPrefix}-${label}-${this.customIdSuffix}`;
  }
}

module.exports = ActionRowPaginator;