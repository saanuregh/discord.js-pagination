/**
 *
 * @param {MessageEmbed[]} pages
 * @param {EmojiIdentifierResolvable[]} emojiList
 * @param {number} currentPageIndex
 * @param {MessageReaction} reaction
 * @returns {number} - the new page index.
 */
const defaultPageResolver = async (_, pages, emojiList, currentPageIndex, reaction) => {
  let newPage = currentPageIndex;
  switch (reaction.emoji.name) {
    case emojiList[0]:
      newPage = currentPageIndex > 0 ? currentPageIndex - 1 : pages.length - 1;
      break;
    case emojiList[1]:
      newPage = currentPageIndex + 1 < pages.length ? currentPageIndex + 1 : 0;
      break;
    default:
      return currentPageIndex;
  }
  return newPage;
};

const defaultFooterResolver = (currentPageIndex, pagesLength) => `Page ${currentPageIndex + 1} / ${pagesLength}`;

const defaultSendMessage = (message, pageEmbed) => message.channel.send(pageEmbed);

const defaultCollectorFilter = (reaction, user, emojiList) => emojiList.includes(reaction.emoji.name) && !user.bot;

/**
 *
 * @param {Message} msg - the message
 * @param {MessageEmbed[]} pages - array of message embeds to use as each page.
 * @param {PaginationOptions} paginationOptions - exposes collector options, provides customization.
 */
const paginationEmbed = async (msg, pages,
  {
    deleteOnEnd = false,
    emojiList = ['⏪', '⏩'],
    footerResolver = defaultFooterResolver,
    sendMessage = defaultSendMessage,
    collectorFilter = defaultCollectorFilter,
    pageResolver = defaultPageResolver,
    collectErrorHandler = () => {},
    timeout = 120000,
    ...rest
  } = {}
) => {
  if (!msg && !msg.channel) throw new Error('Channel is inaccessible.');
  if (!pages) throw new Error('Pages are not given.');
  let currentPageIndex = 0;
  pages[currentPageIndex].setFooter(footerResolver(currentPageIndex, pages.length));
  const paginatedEmbedMessage = await sendMessage(msg, pages[currentPageIndex]);
  const reactionCollector = paginatedEmbedMessage.createReactionCollector(
  async (reaction, user) => await collectorFilter(reaction, user, emojiList),
    { time: timeout, ...rest }
  );
  reactionCollector.on('collect', async (reaction, user) => {
    // this try / catch is to handle the edge case where a collect event is fired after a message delete call
    // but before the delete is complete, handling is offloaded to the user via collectErrorHandler
    try {
      await reaction.users.remove(user.id);
      const currentPage = currentPageIndex;

      currentPageIndex = await pageResolver(paginatedEmbedMessage, pages, emojiList, currentPageIndex, reaction);
      if ( !paginatedEmbedMessage.deleted && currentPage != currentPageIndex && currentPageIndex >= 0 && currentPageIndex < pages.length)
        await paginatedEmbedMessage.edit(pages[currentPageIndex].setFooter(footerResolver(currentPageIndex, pages.length)));
      } catch(error) {
        await collectErrorHandler(error);
      }
  });
  reactionCollector.on('end', async () => {
    if (paginatedEmbedMessage.deletable && deleteOnEnd)
      await paginatedEmbedMessage.delete();
    else
      paginatedEmbedMessage.reactions.removeAll();
  });
  for (const emoji of emojiList) await paginatedEmbedMessage.react(emoji);
  return paginatedEmbedMessage;
};

module.exports = paginationEmbed;
