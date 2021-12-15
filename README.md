<div align="center">
  <p>
    <a href="https://nodei.co/npm/discord-paginate
/"><img src="https://nodei.co/npm/discord-paginate.png?downloads=true&stars=true" alt="NPM info" /></a>
  </p>
</div>


# discorde-paginate
This is a maintiained fork of discord.js-pagination
A simple utility to paginate discord embeds. Built on discord.js@^13.3.1 (master). Compatible with MessageEmbeds. Pages are embeds.

# Installation
* `npm install discord-paginate`

# Usage
__Basic Bot Example__
```js
// Import the discord.js-paginate package
const { paginationEmbed } = require('discord-paginate');

// Use MessageEmbed to make pages
// Keep in mind that Embeds should't have their footers set since the pagination method sets page info there
const { MessageEmbed } = require('discord.js');
const embed1 = new MessageEmbed();
const embed2 = new MesssageEmbed();
// .....
// Create an array of embeds
pages = [
	embed1,
	embed2,
	// ....
	embedn
];

// emojiList paramater is for the page-turners, defaults to ['⏪', '⏩']
// timeout is the duration (in ms) after an interaction where the bot stops accepting interactions, defualts to 120000 (120s or 2m)
paginationEmbed(msg /* D.js Message */, pages /* array of MessageEmbed objects */, emojiList /* optional */, timeout /* optional */);
// There you go, now you have paged embeds
```
