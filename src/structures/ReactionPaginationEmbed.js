const BasePaginationEmbed = require('./BasePaginationEmbed');
const { defaultInteractables, defaultCollectorFilter, defaultPageResolver,
        defaultCollectorEndHandler } = require('../util/ReactionPaginatorDefaults')

const defaultOptions = { interactables: defaultInteractables, collectorFilter: defaultCollectorFilter, 
  pageResolver: defaultPageResolver, collectorEndHandler: defaultCollectorEndHandler }

console.log(defaultOptions);

class ReactionPaginationEmbed extends BasePaginationEmbed {

  constructor(receivedInteraction, pages, options) {
    super(receivedInteraction, pages, {
            ...defaultOptions,
            ...options});
  }

	async _setupPaginationCollector() {
		const reactionCollector = this.paginationEmbedMessage.createReactionCollector({
			// TODO: Come back to this.
			...this.options,
			filter: async (reaction, user) => {
				return await this.collectorFilter({ reaction, user, interactables: this.interactables });
			},
			time: this.timeout
		});
		reactionCollector.on('collect', async (reaction, user) => {
			// this try / catch is to handle the edge case where a collect event is fired after a message delete call
			// but before the delete is complete, handling is offloaded to the user via collectErrorHandler
			try {
				await reaction.users.remove(user.id);
				const previousPageIndex = this.currentPageIndex;
				this.currentPageIndex = await this.pageResolver({ reaction, user, paginator: this });
				if (this._shouldChangePage(previousPageIndex))
          await this.paginationEmbedMessage.edit({ embeds: [this.currentPage.setFooter(this.footerResolver(this))] });
			} catch(error) {
				await this._handleCollectError({ error, paginator: this });
			}
		});
		reactionCollector.on('end', async (collected, reason) => {
			await this._handleCollectEnd({ collected, reason, paginator: this });
		});
		return reactionCollector;
	}

	async _handlePostCollectorSetup() {
		for (const interactable of this.interactables)
      await this.paginationEmbedMessage.react(interactable);
	}
}

module.exports = ReactionPaginationEmbed;
