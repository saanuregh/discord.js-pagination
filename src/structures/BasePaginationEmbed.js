const EventEmitter = require('events');
const PaginationEvents = require('../util/PaginationEvents');

class BasePaginationEmbed extends EventEmitter {
	constructor(interaction, pages, options) {
		super();

		if (!interaction)
			throw new Error('The received prompt is undefined.');
		if (!interaction.channel)
			throw new Error('The received prompt does not have a valid channel.');

		Object.defineProperty(this, 'client', { value: interaction.client });
		Object.defineProperty(this, 'user', {value: interaction.author || interaction.user });
		Object.defineProperty(this, 'channel', { value: interaction.channel });
		Object.defineProperty(this, 'interaction', { value: interaction });

		this.pages = pages;
		this.messageSender = options.messageSender;
		this.options = options;
		this.collectorFilter = options.collectorFilter;
		this.pageResolver = options.pageResolver;
		this.shouldChangePage = options.shouldChangePage;
		this.footerResolver = options.footerResolver;
		this.startingIndex = options.startingIndex;
	}

	_createCollector() {
		throw new Error('_createCollector has not been implemented');
	}

	getCollectorArgs() {
		throw new Error('getCollectorArgs has not been implements.');
	}

	async _collectorFilter(...args) {
		return await this.collectorFilter(this.getCollectorArgs(args));
	}

	get collectorFilterOptions() {
		return {
			...this.options,
			filter: this._collectorFilter.bind(this)
		};
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
			throw new Error('There doesn\'t seem to be a valid messageSsender');
	}

	async _postSetup() {}

	_shouldChangePage(changePageArgs) {
		if (this.shouldChangePage)
			return this.shouldChangePage(changePageArgs);
		return true;
	}

	_collectStart(args) {
		this.emit(PaginationEvents.COLLECT_START, args);
	}

	_collectEnd(args) {
		this.emit(PaginationEvents.COLLECT_END, args);
	}

	async send() {
		if (this._isSent) return;
		await this._preSetup();
		this.currentPageIndex = this.startingIndex;

		await this._resolveFooter();
		this.message = await this.messageSender(this);
		this.collector = this._createCollector();

		this.collector.on('collect', this._handleCollect.bind(this));
		this.collector.on('end', this._handleCollectEnd.bind(this));
		await this._postSetup();
		Object.defineProperty(this, '_isSent', { value: true });
		return this;
	}

	async _handleCollect(...args) {
		// this try / catch is to handle the edge case where a collect event is fired after a message delete call
		// but before the delete is complete, handling is offloaded to the user via collect error event
		try {
			await this._collectStart(this.getCollectorArgs(args));
			const collectorArgs = this.getCollectorArgs(args);
			const newPageIndex = await this.pageResolver(collectorArgs);
			const changePageArgs = {
				...collectorArgs,
				newPageIndex,
				currentPageIndex: this.currentPageIndex,
				paginator: this
			};
			await this.changePage(changePageArgs);
			await this._collectEnd(collectorArgs);
		} catch(error) {
			this.emit(PaginationEvents.COLLECT_ERROR, { error, paginator: this });
		}
	}

	async changePage(changePageArgs) {
		if (await this._shouldChangePage(changePageArgs)) {
			this._previousPageIndex = this.currentPageIndex;
			this.currentPageIndex = changePageArgs.newPageIndex;
			await this._resolveFooter();
			this.emit(PaginationEvents.BEFORE_PAGE_CHANGED, changePageArgs);
			await this.message.edit(this.currentPageMessageOptions);
			this.emit(PaginationEvents.PAGE_CHANGED, changePageArgs);
		} else {
			this.emit(PaginationEvents.PAGE_UNCHANGED);
		}
	}

	get notSent() {
		return !!this._isSent;
	}

	get numberOfPages() {
		return this.pages.length;
	}

	get previousPageIndex() {
		return this._previousPageIndex || -1;
	}

	get currentPageIndex() {
		return this._currentPageIndex;
	}

	set currentPageIndex(pageIndex) {
		// eslint-disable-next-line no-extra-boolean-cast
		if (pageIndex === undefined) return;

		if (pageIndex < 0)
			this._currentPageIndex = this.numberOfPages + (pageIndex % this.numberOfPages);
		else if (pageIndex >= this.numberOfPages)
			this._currentPageIndex = pageIndex % this.numberOfPages;
		else
			this._currentPageIndex = pageIndex;
	}

	get currentPage() {
		return this.pages[this.currentPageIndex];
	}

	get currentPageMessageOptions() {
		return { embeds: [this.currentPage] };
	}

	get startingIndex() {
		if (this._startingIndex === undefined)
			return 0;
		return this._startingIndex;
	}

	set startingIndex(startingIndex) {
		this._startingIndex = startingIndex;
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

	setPageResolver(pageResolver) {
		this.pageResolver = pageResolver;
		return this;
	}

	setFooterResolver(footerResolver) {
		this.footerResolver = footerResolver;
		return this;
	}

	setStartingIndex(startingIndex) {
		if (this.notSent)
			this.startingIndex = startingIndex;
		return this;
	}

	async stop(reason = 'paginator') {
		if (!this.collector.ended)
			this.collector.stop(reason);
		this.removeAllListeners();
	}
}

module.exports = BasePaginationEmbed;
