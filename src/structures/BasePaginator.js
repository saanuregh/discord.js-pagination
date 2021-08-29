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
    if (typeof options.pageMessageOptionsResolver === 'undefined') {
      if (typeof options.useCache === 'boolean' && !options.useCache) {
        throw new Error('pageMessageOptionsResolver must be provided if useCache is false');
      }
      if (typeof options.pages === 'undefined' || options.pages.length === 0) {
        throw new Error('pages must be provided if not using a pageMessageOptionsResolver');
      }
    }

    Object.defineProperty(this, 'client', { value: interaction.client });
    Object.defineProperty(this, 'user', { value: interaction.user });
    Object.defineProperty(this, 'channel', { value: interaction.channel });
    Object.defineProperty(this, 'interaction', { value: interaction });
    Object.defineProperty(this, 'pages', { value: new Collection() });

    this.options = options;
    this.messageSender = options.messageSender;
    this.collectorFilter = options.collectorFilter;
    this.pageIdentifierResolver = options.pageIdentifierResolver;
    this.pageMessageOptionsResolver = options.pageMessageOptionsResolver;
    this.shouldChangePage = options.shouldChangePage || null;
    this.footerResolver = options.footerResolver || null;
    this.startingPageIdentifier = options.startingPageIdentifier;
    this.useCache = typeof options.useCache === 'boolean' ? options.useCache : true;
    // If using cache and no embed resolver, pages can infer max number of pages.
    if (this.useCache && typeof this.pageMessageOptionsResolver !== 'function') {
      this.maxNumberOfPages = this.options.pages.length;
    } else {
      this.maxNumberOfPages = options.maxNumberOfPages;
    }

    if (this.useCache && options.pages && options.pages.length > 0) {
      const { pages } = options;
      pages.forEach((page, pageIndex) => {
        this.pages.set(pageIndex, { embeds: [page] });
      });
    }
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

  async _resolvePageMessageOptions(changePageArgs) {
    const { currentPageIdentifier, newPageIdentifier } = changePageArgs;
    let newPage = null;
    if (this.useCache && this.pages.has(newPageIdentifier)) {
      newPage = this.pages.get(newPageIdentifier);
    } else {
      newPage = await this.pageMessageOptionsResolver(changePageArgs);
      if (this.useCache) {
        this.pages.set(newPageIdentifier, newPage);
      }
    }

    if (typeof this.footerResolver === 'function' && newPage !== null && typeof newPage !== 'undefined') {
      newPage.embeds[0].setFooter(await this.footerResolver(this));
    }

    this.previousPageIdentifier = currentPageIdentifier;
    this.currentPageIdentifier = newPageIdentifier;

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
    this.currentPage = await this._resolvePageMessageOptions({
      newPageIdentifier: this.startingPageIdentifier,
      currentPageIdentifier: null,
      paginator: this,
    });

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
      this.currentPage = await this._resolvePageMessageOptions(changePageArgs);
      this.emit(PaginatorEvents.BEFORE_PAGE_CHANGED, changePageArgs);
      await this.message.edit(this.currentPage);
      this.emit(PaginatorEvents.PAGE_CHANGED, changePageArgs);
    } else {
      this.emit(PaginatorEvents.PAGE_UNCHANGED);
    }
  }

  get notSent() {
    return typeof this._isSent !== 'boolean' || !this._isSent;
  }

  get numberOfKnownPages() {
    if (this.useCache) return this.pages.size;
    else return this.maxNumberOfPages;
  }

  get previousPageIdentifier() {
    return this._previousPageIdentifier || null;
  }

  set previousPageIdentifier(previousPageIdentifier) {
    this._previousPageIdentifier = previousPageIdentifier;
  }

  setPage(pageIdentifier, pageMessageOptions) {
    this.pages.set(pageIdentifier, pageMessageOptions);
    return this;
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

  setPageMessageOptionsResolver(pageMessageOptionsResolver) {
    this.pageMessageOptionsResolver = pageMessageOptionsResolver;
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
