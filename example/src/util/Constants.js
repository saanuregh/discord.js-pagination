'use strict';

const { EmbedBuilder } = require('discord.js');

const pages = [];
for (let i = 0; i < 10; i++) {
  const pageEmbed = new EmbedBuilder()
    .setTitle(`This embed is index ${i}!`)
    .setDescription(`That means it is page #${i + 1}`)
    .setFooter({ text: `Page ${i + 1} / 10` });
    pages.push(pageEmbed);
}
const basicErrorHandler = ({ error }) => console.log(error);

const basicEndHandler = async ({ reason, paginator }) => {
  // This is a basic handler that will delete the message containing the pagination.
  try {
    console.log(`The pagination has ended: ${reason}`);
    if (paginator.message.deletable) await paginator.message.delete();
  } catch (error) {
    console.log('There was an error when deleting the message: ');
    console.log(error);
  }
};

module.exports = {
  basicEndHandler,
  basicErrorHandler,
  pages
}
