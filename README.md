<div align="center">
  <p>
    <a href="https://nodei.co/npm/@psibean/discord.js-pagination
/"><img src="https://nodei.co/npm/@psibean/discord.js-pagination.png?downloads=true&stars=true" alt="NPM info" /></a>
  </p>
</div>


# discord.js-pagination
A simple utility (or advanced - it's your choice) to paginate discord embeds. Built on discord.js@^13.0.0.

To see how the example paginations look, checkout the [example bot](example/README.md) (the readme has gifs)!

## **Upcoming breaking change in 4.0.0**
The design of this new update was heavily driven by the existing discord.js-pagination. There are plans to update the `pageResolver` to take in the collected args and paginator and return a `Promise&lt;MessageEmbed | MessageEmbed` you wish to display. This way you will not have to construct all your embeds pre-emptively, but can instead provide a way to construct them dynamically per page change. This will have the benefit of replying to interactions faster.

##### Table of Contents
- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [Paginator Properties](#paginator-properties)
- [Paginator Options](#paginator-options)
- [Paginator Events](#paginator-events)
- [Installation](#Installation)
- [Installation](#Installation)

# Installation

* `npm install @psibean/discord.js-pagination`

# Basic Usage

For all paginators, the default `messageSender` will call `interaction#editReply` then return `interaction#fetchReply`, this means your command (as per the example bot) must call `interaction#deferReply`.

For the below examples, the pages can be constructed as per the [example bot](example/README.md):

```js
const pages = [];
for (let i = 0; i &lt; 10; i++) {
  const pageEmbed = new MessageEmbed();
  pageEmbed
    .setTitle(`This embed is index ${i}!`)
    .setDescription(`That means it is page #${i + 1}`);
  pages.push(pageEmbed);
}
```

You will of course want to construct your own pages.

**For more complex usage see the [example bot](example/README.md).**

## ReactionPaginator

This allows pages to be navigated by reacting to a message.

```js
const { PaginatorEvents, ReactionPaginator } = require('@psibean/discord.js-pagination');

const reactionPaginator = new ReactionPaginator(interaction, pages)
	.on(PaginatorEvents.COLLECT_ERROR, ({ error }) => console.log(error));
await reactionPaginator.send();
```

## ButtonPaginator

This allows pages to be navigated by clicking buttons.

```js
const { ButtonPaginator } = require('@psibean/discord.js-pagination');

const buttonPaginator = new ButtonPaginator(interaction, pages);
await buttonPaginator.send();
```

## SelectPaginator

This allows pages to be navigated using a select menu.

For the select pagination embed you'll need to supply an array of [MessageSelectOptions](https://discord.js.org/#/docs/main/stable/typedef/MessageSelectOption) to the pagination options via `selectOptions`. By default the pagination will map the value of the provided options to your pages index based on their ordering. Then the page change will be determined by the selected value and this mapping. If you want to map your select options and pages differently you can provide the `pagesMap` ({ selectOptions, paginator }) function which should return a dictionary. You'll then want to provide a custom `pageResolver`.

```js
const { SelectPaginator } = require('@psibean/discord.js-pagination');

// The default pagesMap will map these option values to the index
const selectOptions = [];
for (let i = 0; i &lt; 10; i++)
	selectOptions.push({
		label: `"Page #${i + 1}`,
		value: `${i}`,
		description: `This will take you to page #${i + 1}`
	});

const selectPaginator = new SelectPaginator(interaction, pages);
await buttonPaginator.send();
```

# Paginator Properties

The paginator has a variety of properties you can acces -and should, especially if you're customising!

Properties can be accessed via `paginator#propertyName`

## Base Properties

These properties are common to all paginators.

- **client** : The client that instantiated the paginator.
- **interaction** : The interaction that initiated the instantiation of the paginator.
- **user** : The user who sent the interaction that instantiated the paginator.
- **channel** : The channel where the interaction came from, this is also where the paginator message will be sent.
- **pages** : The pages provided in the paginator constructor.
- **startingIndex** : The starting index provided in the paginator options.
- **numberOfPages** : The number of pages.
- **previousPageIndex** : The index of the previous page, -1 indicates no page change.
- **currentPageIndex** : The index of the current page.
- **options** : The options provided to the paginator after merging defaults.

## ActionRowPaginator Properties

These properties are common to the `ButtonPaginator` and `SelectPaginator`.

- **customIdPrefix** : The `customIdPrefix` provided in options. Used to prefix all `MessageComponent#customId`'s.
- **customIdSuffix** : The `interaction#id`. Used to suffix all `MessageComponent#customId`'s.

### 

# Paginator Options

The following options are available for the respective paginators.

## Base Options

All paginators can take the options of their respective collector, see discord.js documentation for those. Instead of filter, provide `collectorFilter`. The options listed here are available to all paginators.

### messageSender

The function used to send the intial page, it returns the message.

(paginator): Promise&lt;Message&gt; | Message
- **paginator** : This is a reference to the paginator instance.

Defaults to:
```js
	messageSender: async (paginator) => {
		await paginator.interaction.editReply(paginator.currentPageMessageOptions);
		return paginator.interaction.fetchReply();
	}
```

### collectorFilter

This is the function used as the paginators collector filter.

({ ...*, paginator }): Promise&lt;boolean&gt; | boolean
- **...\*** : Includes any args provided by the collect listener.
- **paginator** : This is a reference to the paginator instance.

For the ReactionPaginator, defaults to:

```js
	({ reaction, user, paginator }) =>
		user === paginator.user && paginator.emojiList.includes(reaction.emoji.name) && !user.bot,
```

For the ButtonPaginator and SelectPaginator, defaults to:

```js
	({ interaction, paginator }) =>
		interaction.user === paginator.user && !interaction.user.bot
```

**Note: For these last two interactions will only be handled if the incoming `Interaction#customId` starts with a matching `ActionRowPaginator#customIdPrefix` and ends with a matching `ActionRowPaginator#customIdSuffix`.**

### pageResolver

This is the function used to determine what page to change to during a collect event, it should return the index of the new page.

({ ...*, paginator }): Promise&lt;integer&gt; | integer
- **...\*** : Includes any args provided by the collect listener.
- **paginator** : This is a reference to the paginator instance.

For the ReactionPaginator, defaults to:

```js
	({ reaction, paginator }) => {
		switch (reaction.emoji.name) {
			case paginator.emojiList[0]:
				return paginator.currentPageIndex - 1;
			case paginator.emojiList[1]:
				return paginator.currentPageIndex + 1;
			default:
				return paginator.currentPageIndex;
		}
```

For the ButtonPaginator, defaults to:

```js
	({ interaction, paginator }) => {
		const val = interaction.customId.toLowerCase();
		if (val.includes('prev'))
			return paginator.currentPageIndex - 1;
		else if (val.includes('next'))
			return paginator.currentPageIndex + 1;
		return paginator.currentPageIndex;
	}
```

For the SelectPaginator, defaults to:

```js
	({ interaction, paginator }) => {
		const [selectedValue] = interaction.values;
		return paginator.pagesMap[selectedValue];
	}
```

### shouldChangePage

This is the function used to determine whether or not a page change should occur during a collect event. If not provided, a page change will always occur during a collect event.

({ ...*, newPageIndex, currentPageIndex, paginator }): Promise&lt;boolean&gt; | boolean
- **...\*** : Includes any args provided by the collect listener.
- **newPageIndex** : This is the index of the page being changed to.
- **currentPageIndex** : This is the index of the current page (before being changed).
- **paginator** : This is a reference to the paginator instance.

Defaults to:

```js
	({ newPageIndex, previousPageIndex, paginator }) =>
		!paginator.message.deleted && newPageIndex !== previousPageIndex,
```

### footerResolver

This is the function used to set the footer of each page. If not provided the embeds will use whatever footers were originally set on them.

(paginator): Promise&lt;string&gt; | string
- **paginator** : This is a reference to the paginator instance.

Defaults to:

```js
	(paginator) =>
		`Page ${paginator.currentPageIndex + 1} / ${paginator.numberOfPages}`
```

### startingIndex

This is the index of the page to start at, defaults to 0 if not provided or invalid.

## ReactionPaginator Options

These options are specific to the `ReactionPaginator`.

### emojiList

An array of emoji resolvables to use as reactions.

Defaults to: ['⏪', '⏩']

## ActionRowPaginator Options

These options are common to the `ButtonPaginator` and `SelectPaginator`.

### customIdPrefix

This is used to prefix all of the `MessageComponent#customId`'s.

Defaults to: "paginator"

## ButtonPaginator Options

These options are specific to the `ButtonPaginator`.

### buttons

An array of [MessageButtonOptions](https://discord.js.org/#/docs/main/stable/typedef/MessageButtonOptions) which will be added to the paginators action row.

Note:
- customId is not required, the paginator will update the customId to be: `&lt;prefix&gt;-[&lt;customId&gt;-]&lt;suffix&gt;` 
where the suffix is the id of the received interaction that initiated the paginator.
- type will be updated to `BUTTON`
- style will default to `PRIMARY` if not set

Defaults to:

```js
[
	{
		label: 'Previous',
	},
	{
		label: 'Next',
	}
],
```

## SelectPaginator Options

These options are specific to the `SelectPaginator`.

### selectOptions

An array of [MessageSelectOptions](https://discord.js.org/#/docs/main/stable/typedef/MessageSelectOption) to be added to the select menu.

Note:
- customId is not required, the paginator will update the customId to be: `&lt;prefix&gt;-[&lt;customId&gt;-]&lt;suffix&gt;` 
where the suffix is the id of the received interaction that initiated the paginator.

### pagesMap

A function that returns a dictionary, or a dictionary. The dictionary should provide a way to map the provided `selectOptions` to your provided `pages`.

If a function:

({ selectOptions, paginator}): Dictionary&lt;K, V&gt;
- **selectOptions** : The selectOptions provided to the paginator after having their customId updated.
- **paginator** : This is a reference to the paginator instance.

# Paginator Events

Events can be imported by:

```
const { PaginatorEvents } = require('@psibean/discord.js-pagination');
```
And accessed by `PaginatorEvents#EventName`

To listen to an event:
```
paginator.on(PaginatorEvents#EventName, eventHandler);
```

All paginators have the following events (by EventName):

### BEFORE_PAGE_CHANGED

'beforePageChanged'

This event is raised in the paginator collectors collect event before the message is edited with a new page.

Parameters: ({ ...*, newPageIndex, currentPageIndex, paginator })
- **...\*** : Includes any args provided by the collect listener.
- **newPageIndex** : This is the index of the page being changed to.
- **currentPageIndex** : This is the index of the current page (before being changed).
- **paginator** : This is a reference to the paginator instance.

### COLLECT_END

'collectEnd'

This event is raised at the end of each collect handled by the paginator collector. Note that this won't be called if an error is thrown or if the paginator does not change page. Use the `COLLECT_ERROR` and `PAGE_CHANGED` events respectively in those cases.

Parameters: ({ error, paginator })
- **error** : This is the error that was caught.
- **paginator** : This is a reference to the paginator instance.

### COLLECT_ERROR

'collectError'

This event is raised when an error occurs within the collect event of the paginators collector.

Parameters: ({ error, paginator })
- **error** : This is the error that was caught.
- **paginator** : This is a reference to the paginator instance.

### COLLECT_START

'collectStart'

This event is raised when an error occurs within the collect event of the paginators collector.

Parameters: ({ error, paginator })
- **error** : This is the error that was caught.
- **paginator** : This is a reference to the paginator instance.

### PAGE_CHANGED

'pageChanged'

This event is raised in the paginator collectors collect event after the message is edited with a new page

Parameters: ({ ...*, newPageIndex, currentPageIndex, paginator })
- ...* : Includes any args provided by the collect listener.
- **newPageIndex** : This is the index of the page being changed to.
- **currentPageIndex** : This is the index of the current page (before being changed).
- **paginator** : This is a reference to the paginator instance.

**It should be noted:** `paginator#currentPageIndex`, `paginator#previousPageIndex` and `paginator#currentPage` will now reflect values based on the `newPageIndex`, which is not the case for BEFORE_PAGE_CHANGED.

### PAGE_UNCHANGED

'pageUnchanged'

This event is raised in the paginator collectors collect event when `paginator#shouldChangePage` has returned false. For example if the new page index matches the current index, a collect event occurred but did not cause a page change.

Parameters: ({ ...*, newPageIndex, currentPageIndex, paginator })
- ...* : Includes any args provided by the collect listener.
- **newPageIndex** : This is the index of the page being changed to.
- **currentPageIndex** : This is the index of the current page (before being changed).
- **paginator** : This is a reference to the paginator instance.

### PAGINATION_END

'paginationEnd'

This event is raised in the paginators collector end event.

Parameters: ({ collected, reason, paginator })
- **collected** : The elements collected by the paginators collector.
- **reason** : The reason the paginators collector ended.
- **paginator** : This is a reference to the paginator instance.

### PAGINATION_READY

'paginationReady'

This event is raised once the paginators collector has been setup and the message has been sent with the starting page.

Parameters: (paginator)
- **paginator** : This is a reference to the paginator instance.