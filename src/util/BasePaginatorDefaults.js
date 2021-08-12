const defaultFooterResolver = ({ currentPageIndex, numberOfPages }) => `Page ${currentPageIndex + 1} / ${numberOfPages}`;

const defaultMessageSender = async (receivedInteraction, currentPage) => await receivedInteraction.channel.send({ embeds: [currentPage] });

module.exports = { defaultFooterResolver, defaultMessageSender }