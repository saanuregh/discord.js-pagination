const EventEmitter = require('events');
const PaginationEvents = require('../util/PaginationEvents');

/**
 * @typedef {Function} MessageSender
 * @param {Message|Interaction} receivedPrompt The initial user prompt that initiated the pagination.
 * @param {MessageEmbed} currentPage The initial page that will be sent, derived from startingIndex.
 * @returns {Message|Promise<Message>} The message that is sent and to be used for pagination.
 */

/**
 * @typedef {CollectorFilter} PaginationCollectorFilter
 */

/**
 * @typedef {Function} PageResolver
 */

/**
 * @typedef {Function} FooterResolver
 */

/**
 * @typedef {Function} collectErrorHandler
 */

/**
 * @typedef {Function} collectorEndHandler
 */

/**
 * @typedef {CollectorOptions} BasePaginationOptions
 * @property {MessageEmbed[]} pages The list of MessageEmbed objects to use as pages.
 * @property {MessageSender} messageSender The function that will handle sending the intial message.
 * @property {ContentResolver}
 * @property {PaginationCollectorFilter}
 * @property {number} timeout
 * @property {PageResolver}
 * @property {FooterResolver}
 * @property {CollectErrorHandler}
 * @property {StartingIndex}
 * @property {CollectorEndHandler}
 */

/**
 *
 */
class BasePaginationEmbed extends EventEmitter {
	constructor(receivedPrompt, pages, options) {
		super();

		if (!receivedPrompt)
			throw new Error('The received prompt is undefined.');
		if (!receivedPrompt.channel)
			throw new Error('The received prompt does not have a valid channel.');

		Object.defineProperty('client', { value: receivedPrompt.client });
		/**
		 * The message or interaction received that initiated the pagination.
		 * @name BasePaginationEmbed#
		 * @type {Message|Interaction}
		 * @readonly
		 */
		Object.defineProperty(this, 'receivedPrompt', { value: receivedPrompt });

		this.pages = pages;
		this.messageSender = options.messageSender;

		/**
		 * The options of this PaginationEmbed.
		 * @type {BasePaginationOptions}
		 */
		this.options = options;
		this.collectorFilter = options.collectorFilter;
		this.pageResolver = options.pageResolver;
		this.shouldChangePage = options.shouldChangePage;
		this.footerResolver = options.footerResolver;
		this._startingIndex = options.startingIndex;
	}

	get collectorFilterOptions() {
		return {
			...this.options,
			filter: this._collectorFilter.bind(this)
		};
	}

	async _collectorFilter(...args) {
		return await this.collectorFilter(this.getCollectorArgs(args));
	}

	_createCollector() {
		throw new Error('_createCollector has not been implemented');
	}

	getCollectorArgs() {
		throw new Error('getCollectorArgs has not been implements.');
	}

	get isCurrentPageIndexValid() {
		return this.currentPageIndex >= 0 && this.currentPageIndex < this.numberOfPages;
	}

	async _postSetup() {}

	_handleCollectError(collectErrorOptions) {
		if (this.collectErrorHandler)
			return this.collectErrorHandler(collectErrorOptions);
	}

	_handleCollectEnd(collected, reason) {
		this.emit(PaginationEvents.PAGINATION_END, { collected, reason, paginator: this });
		this.removeAllListeners();
	}

	async _resolveFooter() {
		if (this.footerResolver)
			this.currentPage.setFooter(
				await this.footerResolver(this));
	}

	async _preSetup() {
		if (!this.pages)
			throw new Error('There don\'t seem to be any pages to send.');
		if (!this.messageSender)
			throw new Error('There doesn\'t seem to be a valid message send');
	}

	async send() {
		if (this._isSent) return;
		await this._preSetup();
		this.currentPageIndex = this.startingIndex;

		await this._resolveFooter();
		this.message = await this.messageSender(this.receivedPrompt, this.currentPage);
		this.collector = this._createCollector();

		this.collector.on('collect', this._handleCollect.bind(this));
		this.collector.on('end', this._handleCollectEnd.bind(this));
		await this._postSetup();
		Object.defineProperty(this, '_isSent', { value: true });
		return this;
	}

	_preCollect(args) {
		this.emit(PaginationEvents.PRE_COLLECT, args);
	}

	_postCollect(args) {
		this.emit(PaginationEvents.POST_COLLECT, args);
	}

	async _handleCollect(...args) {
		// this try / catch is to handle the edge case where a collect event is fired after a message delete call
		// but before the delete is complete, handling is offloaded to the user via collectErrorHandler
		try {
			await this._preCollect(this.getCollectorArgs(args));
			this._previousPageIndex = this.currentPageIndex;
			this.currentPageIndex = await this.pageResolver(this.getCollectorArgs(args));
			const changePageArgs = {
				previousPageIndex: this.previousPageIndex,
				currentPageIndex: this.currentPageIndex,
				paginator: this
			};
			if (await this.shouldChangePage(changePageArgs)) {
				await this._resolveFooter();
				await this.message.edit({ embeds: [this.currentPage] });
				this.emit(PaginationEvents.CHANGE_PAGE, changePageArgs);
			}
			await this._postCollect(this.getCollectorArgs(args));
		} catch(error) {
			this.emit(PaginationEvents.COLLECT_ERROR, { error, paginator: this });
		}
	}

	validateChangePage() {
		return this.currentPageIndex >= 0
			&& this.currentPageIndex < this.numberOfPages;
	}

	get notSent() {
		return !!this._isSent;
	}

	set timeout(timeout) {
		this._timeout = timeout;
	}

	get numberOfPages() {
		return this.pages.length;
	}

	get previousPageIndex() {
		return this._previousPageIndex;
	}

	get currentPageIndex() {
		return this._currentPageIndex;
	}

	set currentPageIndex(currentPageIndex) {
		this._currentPageIndex = currentPageIndex;
	}

	get currentPage() {
		return this.pages[this.currentPageIndex];
	}

	get startingIndex() {
		if (this._startingIndex && this._startingIndex >= 0
					&& this._startingIndex < this.numberOfPages)
			return this._startingIndex;
		return 0;
	}

	set startingIndex(startingIndex) {
		this._startingIndex = startingIndex;
	}

	addPage(page) {
		this.pages.push(page);
		return this;
	}

	setMessageSender(messageSender) {
		if (this.notSent)
			this.messageSender = messageSender;
		return this;
	}

	setCollectorFilter(collectorFilter) {
		if (this.notSent)
			this.collectorFilter = collectorFilter;
		return this;
	}

	setTimeout(timeout) {
		if (this.notSent)
			this.timeout = timeout;
		return this;
	}

	setPageResolver(pageResolver) {
		this.pageResolver = pageResolver;
		return this;
	}

	setFooterResolver(footerResolver) {
		this.footerResolver = footerResolver;
		return this;
	}

	setCollectErrorHandler(collectErrorHandler) {
		this.collectErrorHandler = collectErrorHandler;
		return this;
	}

	setStartingIndex(startingIndex) {
		if (this.notSent)
			this.startingIndex = startingIndex;
		return this;
	}

	setCollectorEndHandler(collectorEndHandler) {
		this.collectorEndHandler = collectorEndHandler;
		return this;
	}
}

module.exports = BasePaginationEmbed;
