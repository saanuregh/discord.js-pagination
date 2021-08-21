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
      if (typeof options.initialPages === 'undefined' || options.initialPages.length === 0) {
        throw new Error('initialPages must be provided if not using a pageEmbedResolver');
      }
    }

    Object.defineProperty(this, 'client', { value: interaction.client });
    Object.defineProperty(this, 'user', { value: interaction.user });
    Object.defineProperty(this, 'channel', { value: interaction.channel });
    Object.defineProperty(this, 'interaction', { value: interaction });
    Object.defineProperty(this, 'pages', { value: new Collection() });

    this.options = options;
    this.initialPages = options.initialPages;
    this.messageSender = options.messageSender;
    this.collectorFilter = options.collectorFilter;
    this.pageIdentifierResolver = options.pageIdentifierResolver;
    this.pageEmbedResolver = options.pageEmbedResolver;
    this.shouldChangePage = options.shouldChangePage || null;
    this.footerResolver = options.footerResolver || null;
    this.startingPageIdentifier =
      typeof options.startingPageIdentifier === 'number' ? options.startingPageIdentifier : null;
    this.useCache = options.useCache || true;
    // If using cache and no embed resolver, initialPages can infer max number of pages.
    if (this.useCache && typeof this.pageEmbedResolver !== 'function') {
      this.maxNumberOfPages = this.initialPages.length;
    } else {
      this.maxNumberOfPages = options.maxNumberOfPages;
    }

    if (options.initialPages && typeof options.mapPages === 'function' && options.useCache) {
      this._handleMapPages(options);
    }
  }

  _handleMapPages(options) {
    options.mapPages({ initialPages: options.initialPages, paginator: this });
  }

  _createCollector() {
    throw new Error('_createCollector has not been implemented');
  }

  getCollectorArgs() {
    throw new Error('getCollectorArgs has not been implements.');
  }

  _collectorFilter(...args) {
    return this.collectorFilter(this.getCollectorArgs(args));
  }

  get collectorFilterOptions() {
    return {
      ...this.options,
      filter: this._collectorFilter.bind(this),
    };
  }

  _handleCollectEnd(collected, reason) {
    this.emit(PaginatorEvents.PAGINATION_END, { collected, reason, paginator: this });
    this.removeAllListeners();
  }

  async _resolveFooter() {
    if (this.footerResolver) this.currentPage.setFooter(await this.footerResolver(this));
  }

  async _resolvePageEmbed(changePageArgs) {
    const { newPageIdentifier } = changePageArgs;
    if (this.useCache && this.pages.has(newPageIdentifier)) {
      return this.pages.get(newPageIdentifier);
    }

    const newPage = await this.pageEmbedResolver(changePageArgs);
    if (this.useCache) {
      this.pages.set(newPageIdentifier, newPage);
    }
    return newPage;
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

  async send() {
    if (this._isSent) return;
    this.currentPageIdentifier = this.startingPageIdentifier;

    await this._resolveFooter();
    this.message = await this.messageSender(this);
    this.collector = this._createCollector();

    this.collector.on('collect', this._handleCollect.bind(this));
    this.collector.on('end', this._handleCollectEnd.bind(this));
    await this._postSetup();
    Object.defineProperty(this, '_isSent', { value: true });
  }

  async _handleCollect(...args) {
    // This try / catch is to handle the edge case where a collect event is fired after a message delete call
    // but before the delete is complete, handling is offloaded to the user via collect error event
    try {
      const collectorArgs = this.getCollectorArgs(args);
      await this._collectStart(collectorArgs);
      const newPageIdentifier = await this.pageIdentifierResolver(collectorArgs);
      const changePageArgs = {
        ...collectorArgs,
        newPageIdentifier,
        currentPageIdentifier: this.currentPageIdentifier,
        paginator: this,
      };
      // Guard against a message deletion in the page resolver.
      if (!this.message.deleted) {
        await this.changePage(changePageArgs);
        await this._collectEnd(collectorArgs);
      }
    } catch (error) {
      this.emit(PaginatorEvents.COLLECT_ERROR, { error, paginator: this });
    }
  }

  async changePage(changePageArgs) {
    if (await this._shouldChangePage(changePageArgs)) {
      this.currentPage = await this._resolvePageEmbed(changePageArgs);
      this.previousPageIdentifier = this.currentPagedentifier;
      this.currentPageIdentifier = changePageArgs.newPageIdentifier;
      await this._resolveFooter();
      this.emit(PaginatorEvents.BEFORE_PAGE_CHANGED, changePageArgs);
      await this.message.edit(this.currentPageMessageOptions);
      this.emit(PaginatorEvents.PAGE_CHANGED, changePageArgs);
    } else {
      this.emit(PaginatorEvents.PAGE_UNCHANGED);
    }
  }

  get notSent() {
    return !!this._isSent;
  }

  get numberOfKnownPages() {
    if (this.useCache) return this.pages.size;
    else return this.maxNumberOfPages;
  }

  get currentPageMessageOptions() {
    return { embeds: [this.currentPage] };
  }

  setMessageSender(messageSender) {
    if (this.notSent) this.messageSender = messageSender;
    return this;
  }

  setCollectorFilter(collectorFilter) {
    this.collectorFilter = collectorFilter;
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

  setStartingPageIdentifier(startingPageIdentifier) {
    if (this.notSent) this.startingPageIdentifier = startingPageIdentifier;
    return this;
  }

  stop(reason = 'paginator') {
    if (!this.collector.ended) this.collector.stop(reason);
    this.removeAllListeners();
  }
}

module.exports = BasePaginator;
