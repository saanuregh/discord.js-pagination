<div align="center">
  <p>
    <a href="https://nodei.co/npm/@psibean/discord.js-pagination
/"><img src="https://nodei.co/npm/@psibean/discord.js-pagination.png?downloads=true&stars=true" alt="NPM info" /></a>
  </p>
</div>

# discord.js-pagination
A simple utility (or advanced - it's your choice) to paginate discord embeds. Built on discord.js@^13.0.0.

To see how the example paginations look, checkout the [example bot](example/README.md) (the readme has gifs)!

### Key Features
- Custom emoji reactions with the ReactionPaginator (see the example app).
- Custom button pagination with the ButtonPaginator (see the example app).
- Custom select menu pagination with the SelectPaginator (see the example app).
- If you have a global interaction listener you can ignore paginator interactions by checking: `interaction.customId.startsWith("paginator")` - this prefix is customizable, set it on all of your paginators.
- Multiple Action Row (combined select and button) pagination!

### Table of Contents
- [Installation](#installation)
- [Updating v3 to v4](#updating)
- [Basic Usage](#basic-usage)
- [Types](#types)
- [Paginator Properties](#paginator-properties)
- [Paginator Options](#paginator-options)
- [Paginator Events](#paginator-events)
# Installation

* `npm install @psibean/discord.js-pagination`

# Updating

To update from version 3 to version 4 you may want to take a look at the [difference between the two versions](https://github.com/psibean/discord.js-pagination/compare/d08bf8c25a8f6284354acfb2a9b8243a218c984e..55364f3d653df0ddf6967c99f5c08ffc9d3a08d5) in the example app.

However, for SIMPLE cases, you likely just need to move your pages parameter into the options object in the constructor call, see the [basic usage](#basic-usage) below!

If you want to make use of the dynamic embed creation you'll want to learn how to use the `identifiersResolver` and the `pageEmbedResolver`, read their descriptions below and check the example app for further demonstration.

# Basic Usage

For all paginators, the default `messageSender` will call `interaction#editReply` then return `interaction#fetchReply`, this means your command (as per the example bot) must call `interaction#deferReply`.

You should use `interaction#deferReply` when you receive an interaction that will send an embed. The paginators default `messageSender` uses `interaction#editReply`. If you do not wish to do this you'll need to pass in your own `messageSender`.

For the below examples, the pages can be constructed as per the [example bot](example/README.md):

```js
const pages = [];
for (let i = 0; i 10; i++) {
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

const reactionPaginator = new ReactionPaginator(interaction, { pages })
	.on(PaginatorEvents.COLLECT_ERROR, ({ error }) => console.log(error));
await reactionPaginator.send();
```

## ButtonPaginator

This allows pages to be navigated by clicking buttons.

```js
const { ButtonPaginator } = require('@psibean/discord.js-pagination');

const buttonPaginator = new ButtonPaginator(interaction, { pages });
await buttonPaginator.send();
```

## SelectPaginator

This allows pages to be navigated using a select menu.

For the select pagination embed you'll need to supply an array of [MessageSelectOptions](https://discord.js.org/#/docs/main/stable/typedef/MessageSelectOption) to the pagination options via `selectOptions`. By default the pagination will map the value of the provided options to your pages index based on their ordering. Then the page change will be determined by the selected value and this mapping. If you want to map your select options and pages differently you can provide the `pagesMap` ({ selectOptions, paginator }) function which should return a dictionary. You'll then want to provide a custom `pageIndexResolver`.

```js
const { SelectPaginator } = require('@psibean/discord.js-pagination');

// The default pagesMap will map these option values to the index
const selectOptions = [];
for (let i = 0; i < 10; i++)
	selectOptions.push({
		label: `"Page #${i + 1}`,
		value: `${i}`,
		description: `This will take you to page #${i + 1}`
	});

const selectPaginator = new SelectPaginator(interaction, pages);
await selectPaginator.send();
```

# Types

## PaginatorIdentifiers

This object is returned by the identifiersResolver and can contain any number of identifiers but at bare minimum it must contain a pageIdentifier.

{ ...args, pageIdentifier: string | number }
- **args**: Any additional identifiers you wish to use.
- **pageIdentifier**: Used as a unique identifier to resolve a page

## PaginatorCollectorArgs

{ ...args, paginator }
- **args**: All arguments provided by the collect listener.
- **paginator** : This is a reference to the paginator instance.

For the ReactionCollector this is:
```
{ reaction, user, paginator }
```

For ActionRowPaginator, ButtonPaginator and SelectPaginator this is:
```
{ interaction, paginator }
```

## ChangePageArgs

{ collectorArgs, previousIdentifiers, currentIdentifiers, newIdentifiers, paginator }
- **collectorArgs**: The [PaginatorCollectorArgs](#paginatorcollectorargs) - only in the collect event (not initial send).
- **previousIdentifiers**: The [PaginatorIdentifiers](#paginatoridentifiers) of the previous page. Empty object if no navigation.
- **currentIdentifiers**: The [PaginatorIdentifiers](#paginatoridentifiers) of the current page, before changing.
- **newIdentifiers**: THe [PaginatorIdentifiers](#paginatoridentifiers) of the page to be changed to.
- **paginator** : This is a reference to the paginator instance.

# Paginator Properties

The paginator has a variety of properties you can acces -and should, especially if you're customising!

Properties can be accessed via `paginator#propertyName`

## Base Properties

These properties are common to all paginators.

- **client** : The client that instantiated the paginator.
- **interaction** : The interaction that initiated the instantiation of the paginator.
- **user** : The user who sent the interaction that instantiated the paginator.
- **channel** : The channel where the interaction came from, this is also where the paginator message will be sent.
- **pages** : The cache of MessageEmbeds mapped by their respective `PaginationIdentifiers#pageIdentifier`.
  - If pages are provided in the options of the constructor, this will be all of the pages provided mapped by their index.
- **initialIdentifiers** : The initial [PaginatorIdentifiers](#paginatoridentifiers) provided in the paginator options.
- **numberOfPages** : The number of pages.
- **previousPageIdentifiers** : The [PaginatorIdentifiers](#paginatoridentifiers) from the previous navigation, `null` indicates no page change yet.
- **currentPageIdentifiers** : The [PaginatorIdentifiers](#paginatoridentifiers) of the current page.
- **options** : The options provided to the paginator after merging defaults.

## ActionRowPaginator Properties

These properties are common to the `ButtonPaginator` and `SelectPaginator`.

- **customIdPrefix** : The `customIdPrefix` provided in options. Used to prefix all `MessageComponent#customId`'s.
- **customIdSuffix** : The `interaction#id`. Used to suffix all `MessageComponent#customId`'s.

## SelectPaginator Properties

These properties are specific to the `SelectPaginator`.

- **selectMenu** : The select menu on the paginator message action row.

# Paginator Options

The following options are available for the respective paginators.

## Base Options

All paginators can take the options of their respective collector, see discord.js documentation for those. Instead of filter, provide `collectorFilter`. The options listed here are available to all paginators.

### messageSender

The function used to send the intial page, it returns the message.

({ interaction, messageOptions }): Promise&lt;Message&gt; | Message
- **interaction** : This is a reference to the initial interaction that instantiated the paginator.
- **messageOptions** : The MessageOptions for the initial page.

Defaults to:
```js
	messageSender: async ({ interaction, messageOptions }) => {
		await paginator.interaction.editReply(messageOptions);
		return paginator.interaction.fetchReply();
	}
```
### pageEmbedResolver

This is used to determine the current pages embed based on the change page args.

(changePageArgs: [ChangePageArgs](#changepageargs)): Promise&lt;MessageEmbed&gt; | MessageEmbed

If using cache this function will only be called if the embed isn't already in the cache and the embed will be added to the cache mapped to it's corresponding `pageIdentifier`.

### useCache

Whether or not embeds should be cached, keyed by their pageIdentifier.

Defaults to true.

### maxPageCache

The maximum number of pages that should be cached. If this number is reached the cache will be emptied before a new page is cached.

Defaults to 100.
### messageOptionsResolver

This function is used to determine additional MessageOptions for the page being changed to.

(options: [ChangePageArgs](#changepageargs)): Promise&lt;MessageOptions&gt; | MessageOptions

Defaults to returning an empty object. Optional.

### collectorOptions

This is the options that will be passed to the collector when it is created.

For the ReactionPaginator, defaults to:

```js
{
	idle: 6e4,
	filter: ({ reaction, user, paginator }) =>
		user === paginator.user && paginator.emojiList.includes(reaction.emoji.name) && !user.bot,
}
```

For the ActionRowPaginator, ButtonPaginator and SelectPaginator, defaults to:

```js
{
	idle: 6e4,
	filter: ({ interaction, paginator }) =>
		interaction.isMessageComponent() &&
		interaction.component.customId.startsWith(paginator.customIdPrefix) &&
		interaction.user === paginator.user &&
		!interaction.user.bot,
	},
}
```

### identifiersResolver

This is the function used to determine the new identifiers object based on the interaction that occurred. The object **must** contain a `pageIdentifier` but can otherwise contain anything else.

(collectorArgs: [PaginatorCollectorArgs](#paginatorcollectorargs)): Promise&lt;[PaginatorIdentifiers](#paginatoridentifiers)&gt; | [PaginatorIdentifiers](#paginatoridentifiers)

Whatever this function returns will be used as the `newIdentifiers` object for it's collect event.

For the ReactionPaginator, defaults to:

```js
({ reaction, paginator }) => {
	let { pageIdentifier } = paginator.currentIdentifiers;
	switch (reaction.emoji.name) {
		case paginator.emojiList[0]:
			pageIdentifier -= 1;
			break;
		case paginator.emojiList[1]:
			pageIdentifier += 1;
			break;
	}
	// The default identifier is a cyclic index.
	if (pageIdentifier < 0) {
		pageIdentifier = paginator.maxNumberOfPages + (pageIdentifier % paginator.maxNumberOfPages);
	} else if (pageIdentifier >= paginator.maxNumberOfPages) {
		pageIdentifier %= paginator.maxNumberOfPages;
	}
	return { ...paginator.currentIdentifiers, pageIdentifier };
}
```

For the ButtonPaginator, defaults to:

```js
({ interaction, paginator }) => {
	const val = interaction.component.label.toLowerCase();
	let { pageIdentifier } = paginator.currentIdentifiers;
	if (val === 'previous') pageIdentifier -= 1;
	else if (val === 'next') pageIdentifier += 1;
	// The default identifier is a cyclic index.
	if (pageIdentifier < 0) {
		pageIdentifier = paginator.maxNumberOfPages + (pageIdentifier % paginator.maxNumberOfPages);
	} else if (pageIdentifier >= paginator.maxNumberOfPages) {
		pageIdentifier %= paginator.maxNumberOfPages;
	}
	return { ...paginator.currentIdentifiers, pageIdentifier };
}
```

For the SelectPaginator, defaults to:

```js
({ interaction, paginator }) => {
	const [selectedValue] = interaction.values;
	return { ...paginator.currentIdentifiers, pageIdentifier: parseInt(selectedValue) };
},
```

### shouldChangePage

This is the function used to determine whether or not a page change should occur during a collect event. If not provided, a page change will always occur during a collect event.

(args: [ChangePageArgs](#changepageargs)): Promise&lt;boolean&gt; | boolean

Defaults to:

```js
({ newIdentifiers, currentIdentifiers, paginator }) =>
		paginator.message.deletable && newIdentifiers.pageIdentifier !== currentIdentifiers.pageIdentifier,
```

### footerResolver

This is the function used to set the footer of each page. If not provided the embeds will use whatever footers were originally set on them.

(paginator): Promise&lt;string&gt; | string
- **paginator** : This is a reference to the paginator instance.

Defaults to undefined. Optional.

### initialIdentifiers

This is the initial [PageIdentifiers](#pageidentifiers) which is passed in as the `newIdentifiers` in the very first send.

## ReactionPaginator Options

These options are specific to the `ReactionPaginator`.

### emojiList

An array of emoji resolvables to use as reactions.

Defaults to: ['⏪', '⏩']

## ActionRowPaginator Options

These options are common to the `ActionRowPaginator`, `ButtonPaginator`, and `SelectPaginator`.

### messageActionRows

An array of messageActionRows (they will have their type set to ACTION_ROW).
Any components provided up front will have their customId generated.

Defaults to:
```
[
	{
		type: 'ACTION_ROW',
		components: [],
	},
],
```

### customIdPrefix

This is used to prefix all of the `MessageComponent#customId`'s.

Defaults to: "paginator"

## ButtonPaginator Options

These options are specific to the `ButtonPaginator`.

### buttons

An array of [MessageButtonOptions](https://discord.js.org/#/docs/main/stable/typedef/MessageButtonOptions) which will be added to the paginators action row.
Can be skipped if you're degining the `ActionRowPaginator#messageActionRows` option. Otherwise these will be added to either the first action row, or added based on a `row` property.

Note:
- customId is not required, the paginator will update the customId to be: `<prefix>-[<customId>-]<suffix>` 
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
- customId is not required, the paginator will update the customId to be: `<prefix>-[<customId>-]<suffix>` 
where the prefix is `paginator#customIdPrefix` and the suffix is the id of the received interaction that initiated the paginator.

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

Parameters: ({ ...*, newPageIdentifier, currentPageIdentifier, paginator })
- **...\*** : Includes any args provided by the collect listener.
- **newPageIdentifier** : This is the index of the page being changed to.
- **currentPageIdentifier** : This is the index of the current page (before being changed).
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

Parameters: ({ ...*, newPageIdentifier, currentPageIdentifier, paginator })
- ...* : Includes any args provided by the collect listener.
- **newPageIdentifier** : This is the index of the page being changed to.
- **currentPageIdentifier** : This is the index of the current page (before being changed).
- **paginator** : This is a reference to the paginator instance.

**It should be noted:** `paginator#currentPageIdentifier`, `paginator#previousPageIdentifier` and `paginator#currentPage` will now reflect values based on the `newPageIdentifier`, which is not the case for BEFORE_PAGE_CHANGED.

### PAGE_UNCHANGED

'pageUnchanged'

This event is raised in the paginator collectors collect event when `paginator#shouldChangePage` has returned false. For example if the new page index matches the current index, a collect event occurred but did not cause a page change.

Parameters: ({ ...*, newPageIdentifier, currentPageIdentifier, paginator })
- ...* : Includes any args provided by the collect listener.
- **newPageIdentifier** : This is the index of the page being changed to.
- **currentPageIdentifier** : This is the index of the current page (before being changed).
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