'use strict';

const { MessageEmbed } = require('discord.js');

const myPages = [];
for (let i = 0; i < 10; i++) {
  const pageEmbed = new MessageEmbed();
  pageEmbed.setTitle(`This embed is index ${i}!`).setDescription(`That means it is page #${i + 1}`);
  pageEmbed.setFooter(`Page ${i + 1} / 10`);
  myPages.push(pageEmbed);
}

module.exports.pages = myPages;

module.exports.basicErrorHandler = ({ error }) => console.log(error);
module.exports.basicEndHandler = async ({ reason, paginator }) => {
  // This is a basic handler that will delete the message containing the pagination.
  try {
    console.log(`The pagination has ended: ${reason}`);
    if (paginator.message.deletable) await paginator.message.delete();
  } catch (error) {
    console.log('There was an error when deleting the message: ');
    console.log(error);
  }
};
