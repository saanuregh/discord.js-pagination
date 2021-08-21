'use strict';

const EventEmitter = require('events');
const { Collection } = require('discord.js');
const PaginatorEvents = require('../util/PaginatorEvents');

class BasePaginator extends EventEmitter {
  constructor(interaction, options) {
    super();

    if (!interaction) throw new Error('The received prompt is undefined.');
    if (!interaction.channel) throw new Error('The received prompt does not have a valid channel.');

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
    this.startingPageIdentifier = options.startingPageIdentifier || null;
    this.maxNumberOfPages = options.maxNumberOfPages || null;
    this.useCache = options.useCache || true;

    if (options.initialPages && options.mapPages && options.useCache) {
      options.mapPages(options.initialPages, this);
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

  _preSetup() {
    if (!this.messageSender) throw new Error('messageSsender is invalid');
    if (!this.useCache && !this.pageEmbedResolver) {
      throw new Error('If not using cache a pageEmbedResolver must be provided');
    }
    if (this.useCache && !this.pageEmbedResolver && this.numberOfKnownPages === 0) {
      throw new Error();
    }
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
    await this._preSetup();
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

  get maxNumberOfPages() {
    return this.maxNumberOfPages;
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
