<div align="center">
  <p>
    <a href="https://nodei.co/npm/discord.js-pagination
/"><img src="https://nodei.co/npm/discord.js-pagination.png?downloads=true&stars=true" alt="NPM info" /></a>
  </p>
</div>


# discord.js-pagination
A simple utility to paginate discord embeds. Built on discord.js@^13.0.0, v12 support is available (see below) but is not supported. Compatible with MessageEmbeds, RichEmbeds (not tested). Pages are embeds.

# Installation
For discord.js@^13.0.0

* `npm install discord.js-pagination`

For the older version of the package with discord.js@^12.0.0 support:

* `npm install discord.js-pagination@1.0.3`

**Note: the usage for 1.0.3 is completely different (not supported)**

# Usage

__Basic Bot Example__
```js
// Import the discord.js-pagination package
const paginationEmbed = require('discord.js-pagination');

// Use either MessageEmbed or RichEmbed to make pages
// Keep in mind that Embeds should't have their footers set since the pagination method sets page info there
const { MessageEmbed } = require('discord.js');

const myPages = [];

for (let i = 0; i < 10; i++) {
	const pageEmbed = new MessageEmbed();
	pageEmbed
		.setTitle(`This embed is index ${i}!`)
		.setDescription(`That means it is page #${i+1}`);
	myPages.push(pageEmbed);
}

const footerResolver = (currentPageIndex, pagesLength) =>
	`Page ${currentPageIndex + 1} / ${pagesLength}: ${(currentPageIndex % 2 === 0) ? 'This page is even!' : 'This page is odd!'}`;

const collectErrorHandler = ({ error }) => console.log(error);

// Call the paginationEmbed method, first two arguments are required
// The third argument is the PaginationOptions - all optional
// Any additional arguments in PaginationOptions are passed down as ReactionCollectorOptions
paginationEmbed(msg, myPages, { emojiList, footerResolver, collectErrorHandler, timeout: 120000, idle: 60000 });
// There you go, now you have paged embeds
```
# Preview
![Demo](https://raw.githubusercontent.com/saanuregh/discord.js-pagination/master/example/demo.png)
Here is the package used for paging song queue.
