'use strict';

const { Util } = require('discord.js');
const BasePaginator = require('./BasePaginator');
const ReactionPaginatorOptions = require('../util/ReactionPaginatorOptions');

class ReactionPaginator extends BasePaginator {
  constructor(interaction, options) {
    super(interaction, Util.mergeDefault(ReactionPaginatorOptions.createDefault(), options));

    if (typeof options.emojiList === 'undefined' || options.emojiList.length === 0) {
      throw new Error('emojiList is undefined or empty, must be a list of EmojiResolvables');
    }

    this.emojiList = this.options.emojiList;
  }

  _createCollector() {
    return this.message.createReactionCollector(this.collectorOptions);
  }

  getCollectorArgs(args) {
    const [reaction, user] = args;
    return super.getCollectorArgs({ reaction, user });
  }

  async _postSetup() {
    // eslint-disable-next-line no-await-in-loop
    for (const emoji of this.emojiList) await this.message.react(emoji);
    super._postSetup();
  }

  async _collectStart(args) {
    super._collectStart(args);
    await args.reaction.users.remove(args.user);
  }
}

module.exports = ReactionPaginator;
