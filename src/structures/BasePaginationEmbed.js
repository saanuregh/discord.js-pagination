const { defaultFooterResolver, defaultMessageSender } = require('../util/BasePaginatorDefaults');


class BasePaginationEmbed {
	constructor(receivedInteraction, pages, options) {
		console.log(options);
		if (!receivedInteraction) {throw new Error('The provided interaction is undefined.');}
		if (!receivedInteraction.channel) {throw new Error('The provider interaction does');}

		Object.defineProperty(this, '_receivedInteraction', { value: receivedInteraction });
		Object.defineProperty(this, '_interactables', { value: options.interactables || [] });

		this.pages = pages || [];
		this.messageSender = options.messageSender || defaultMessageSender;
		this.collectorFilter = options.collectorFilter;
		this._timeout = options.timeout;
		this.pageResolver = options.pageResolver;
		this.footerResolver = options.footerResolver || defaultFooterResolver;
		this.collectErrorHandler = options.collectErrorHandler;
		this._startingIndex = options.startingIndex;
		this.collectorEndHandler = options.collectorEndHandler;
	}

	async _setupPaginationCollector() {
		throw new Error('setupPaginationCollector not implemented.');
	}

	async _handleCollectError(collectErrorOptions) {
		if (this.collectErrorHandler) {return await this.collectErrorHandler(collectErrorOptions);}
	}

	async _handleCollectEnd() {
		if (this.collectorEndHandler) {return await this.collectorEndHandler();}
	}

	_shouldChangePage(previousPage) {
		return !this.paginationEmbedMessage.deleted && previousPage != this.currentPageIndex
							&& this.currentPageIndex >= 0 && this.currentPageIndex < this.numberOfPages;
	}

	async _handlePostCollectorSetup() {}

	async send() {
		if (!this.pages) throw new Error('There don\'t seem to be any pages to send.');
		if (!this.interactables || this.interactables.length == 0) {throw new Error('There don\'t seem to be any interactables to interact with.');}
		if (this._isSent) return;

		this.currentPageIndex = this.startingIndex;
		this.currentPage.setFooter(this.footerResolver({ currentPageIndex: this.currentPageIndex, numberOfPages: this.numberOfPages, paginator: this }));
		this.paginationEmbedMessage = await this.messageSender(this._receivedInteraction, this.currentPage);
		this.paginationCollector = this._setupPaginationCollector();
		await this._handlePostCollectorSetup();
		Object.defineProperty(this, '_isSent', { value: true });
		return { message: this.paginationEmbedMessage, collector: this.paginationCollector };
	}

	get interactables() {
		return this._interactables;
	}

	get timeout() {
		if (this._timeout) return this._timeout;
		return 12e4;
	}

	set timeout(timeout) {
		this.timeout = timeout;
	}

	get numberOfPages() {
		return this.pages.length;
	}

	get currentPage() {
		return this.pages[this.currentPageIndex];
	}

	get startingIndex() {
		if (this._startingIndex && this._startingIndex > 0
					&& this._startingIndex < this.numberOfPages) {return this.startingIndex;}
		return 0;
	}

	set startingIndex(startingIndex) {
		this._startingIndex = startingIndex;
	}

	addInteractable(interactable) {
		this.interactables.push(interactable);
		return this;
	}

	addPage(page) {
		this.pages.push(page);
		return this;
	}

	setSendMessage(sendMessage) {
		this.sendMessage = sendMessage;
		return this;
	}

	setCollectorFilter(collectorFilter) {
		this.collectorFilter = collectorFilter;
		return this;
	}

	setTimeout(timeout) {
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
		this.startingIndex = startingIndex;
		return this;
	}

	setCollectorEndHandler(collectorEndHandler) {
		this.collectorEndHandler = collectorEndHandler;
		return this;
	}
}

module.exports = BasePaginationEmbed;
