'use strict';

const EventEmitter = require('events');
const { Collection } = require('discord.js');
const PaginatorEvents = require('../util/PaginatorEvents');

class BasePaginator extends EventEmitter {
  constructor(interaction, options) {
    super();

    if (typeof interaction === 'undefined') {
      throw new Error('The received interaction is undefined');
    }
    if (typeof interaction.channel === 'undefined') {
      throw new Error('The received interaction does not have a valid channel');
    }
    if (typeof options.messageSender !== 'function') {
      throw new Error('messageSender must be a function');
    }
    if (typeof options.pageEmbedResolver === 'undefined') {
      if (typeof options.useCache === 'boolean' && !options.useCache) {
        throw new Error('pageEmbedResolver must be provided if useCache is false');
      }
      if (typeof options.pages === 'undefined' || options.pages.length === 0) {
        throw new Error('pages must be provided if not using a pageEmbedResolver');
      }
    }

    Object.defineProperty(this, 'client', { value: interaction.client });
    Object.defineProperty(this, 'user', { value: interaction.user });
    Object.defineProperty(this, 'channel', { value: interaction.channel });
    Object.defineProperty(this, 'interaction', { value: interaction });
    Object.defineProperty(this, 'pages', { value: new Collection() });

    this.options = options;
    this.messageSender = options.messageSender;
    this.collectorOptions = options.collectorOptions;
    this.identifiersResolver = options.identifiersResolver;
    this.pageEmbedResolver = options.pageEmbedResolver;
    this.messageOptionsResolver = options.messageOptionsResolver;
    this.shouldChangePage = options.shouldChangePage ?? null;
    this.footerResolver = options.footerResolver ?? null;
    this.initialIdentifiers = options.initialIdentifiers;
    this.currentIdentifiers = {};
    this.useCache = typeof options.useCache === 'boolean' ? options.useCache : true;
    this.maxPageCache = options.maxPageCache;
    // If using cache and no embed resolver, pages can infer max number of pages.
    if (this.useCache && typeof this.pageEmbedResolver !== 'function') {
      this.maxNumberOfPages = this.options.pages.length;
    } else {
      this.maxNumberOfPages = options.maxNumberOfPages;
    }

    if (this.useCache && options.pages && options.pages.length > 0) {
      const { pages } = options;
      pages.forEach((page, pageIndex) => {
        this.pages.set(pageIndex, page);
      });
    }
  }

  _createCollector() {
    throw new Error('_createCollector has not been implemented');
  }

  getCollectorArgs(args) {
    return { ...args, paginator: this };
  }

  _collectorFilter(...args) {
    return this._collectorOptions.filter(this.getCollectorArgs(args));
  }

  _handleCollectEnd(collected, reason) {
    this.emit(PaginatorEvents.PAGINATION_END, { collected, reason, paginator: this });
    this.removeAllListeners();
  }

  async _resolvePageEmbed(changePageArgs) {
    const {
      newIdentifiers: { pageIdentifier },
    } = changePageArgs;
    let newPage = await this.pageEmbedResolver(changePageArgs);
    if (this.useCache) {
      if (this.pages.size >= this.maxPageCache) {
        this.pages.clear();
      }
      this.pages.set(pageIdentifier, newPage);
    }
    return newPage;
  }

  async _resolveMessageOptions({ messageOptions = {}, changePageArgs }) {
    if (typeof this.messageOptionsResolver === 'function') {
      const customMessageOptions = await this.messageOptionsResolver(changePageArgs);
      return { ...messageOptions, ...customMessageOptions, embeds: [this.currentPage] };
    }
    return { ...messageOptions, embeds: [this.currentPage] };
  }

  _postSetup() {
    this.emit(PaginatorEvents.PAGINATION_READY, this);
  }

  _shouldChangePage(changePageArgs) {
    if (this.shouldChangePage) return this.shouldChangePage(changePageArgs);
    return true;
  }

  _collectStart(args) {
    this.emit(PaginatorEvents.COLLECT_START, args);
  }

  _collectEnd(args) {
    this.emit(PaginatorEvents.COLLECT_END, args);
  }

  async _resolveCurrentPage(changePageArgs) {
    const { newIdentifiers, currentIdentifiers } = changePageArgs;
    if (this.useCache && this.pages.has(newIdentifiers.pageIdentifier)) {
      this.currentPage = this.pages.get(newIdentifiers.pageIdentifier);
    } else {
      this.currentPage = await this._resolvePageEmbed(changePageArgs);
    }
    if (typeof this.footerResolver === 'function') {
      this.currentPage.setFooter(await this.footerResolver(this));
    }
    this.previousIdentifiers = currentIdentifiers;
    this.currentIdentifiers = newIdentifiers;
  }

  async send() {
    if (this._isSent) return;
    const changePageArgs = {
      newIdentifiers: this.initialIdentifiers,
      currentIdentifiers: {},
      paginator: this,
    };

    await this._resolveCurrentPage(changePageArgs);

    const messageOptions = await this._resolveMessageOptions({ changePageArgs });
    this.currentPageMessageOptions = messageOptions;
    this.message = await this.messageSender({ interaction: this.interaction, messageOptions, paginator: this });
    Object.defineProperty(this, '_isSent', { value: true });
    this.collector = this._createCollector();

    this.collector.on('collect', this._handleCollect.bind(this));
    this.collector.on('end', this._handleCollectEnd.bind(this));
    await this._postSetup();
  }

  async _handleCollect(...args) {
    // This try / catch is to handle the edge case where a collect event is fired after a message delete call
    // but before the delete is complete, handling is offloaded to the user via collect error event
    try {
      const collectorArgs = this.getCollectorArgs(args);
      await this._collectStart(collectorArgs);
      const newIdentifiers = await this.identifiersResolver(collectorArgs);
      const changePageArgs = {
        collectorArgs,
        previousIdentifiers: this.previousIdentifiers,
        currentIdentifiers: this.currentIdentifiers,
        newIdentifiers,
        paginator: this,
      };
      // Guard against a message deletion in the page resolver.
      if (this.message.deletable) {
        await this.changePage(changePageArgs);
        await this._collectEnd(collectorArgs);
      }
    } catch (error) {
      this.emit(PaginatorEvents.COLLECT_ERROR, { error, paginator: this });
    }
  }

  async changePage(changePageArgs) {
    if (await this._shouldChangePage(changePageArgs)) {
      await this._resolveCurrentPage(changePageArgs);
      this.emit(PaginatorEvents.BEFORE_PAGE_CHANGED, changePageArgs);
      const messageOptions = await this._resolveMessageOptions({ changePageArgs });
      this.currentPageMessageOptions = messageOptions;
      await this.editMessage({ changePageArgs, messageOptions });
      this.emit(PaginatorEvents.PAGE_CHANGED, changePageArgs);
    } else {
      this.emit(PaginatorEvents.PAGE_UNCHANGED, changePageArgs);
    }
  }

  editMessage({ messageOptions }) {
    return this.message.edit(messageOptions);
  }

  get notSent() {
    return typeof this._isSent !== 'boolean' || !this._isSent;
  }

  get numberOfKnownPages() {
    if (this.useCache) return this.pages.size;
    else return this.maxNumberOfPages;
  }

  get collectorOptions() {
    return {
      ...this._collectorOptions,
      filter: this._collectorFilter.bind(this),
    };
  }

  set collectorOptions(options) {
    this._collectorOptions = options;
  }

  setPage(pageIdentifier, pageEmbed) {
    this.pages.set(pageIdentifier, pageEmbed);
    return this;
  }

  setMessageSender(messageSender) {
    if (this.notSent) this.messageSender = messageSender;
    return this;
  }

  setCollectorFilter(collectorFilter) {
    this.options.filter = collectorFilter;
    return this;
  }

  setCollectorOptions(collectorOptions) {
    this.collectorOptions = collectorOptions;
    return this;
  }

  setPageIdentifierResolver(pageIdentifierResolver) {
    this.pageIdentifierResolver = pageIdentifierResolver;
    return this;
  }

  setPageEmbedResolver(pageEmbedResolver) {
    this.pageEmbedResolver = pageEmbedResolver;
    return this;
  }

  setFooterResolver(footerResolver) {
    this.footerResolver = footerResolver;
    return this;
  }

  setInitialIdentifiers(initialIdentifiers) {
    if (this.notSent) this.initialIdentifiers = initialIdentifiers;
    return this;
  }

  stop(reason = 'paginator') {
    if (!this.collector.ended) this.collector.stop(reason);
    this.removeAllListeners();
  }
}

module.exports = BasePaginator;
