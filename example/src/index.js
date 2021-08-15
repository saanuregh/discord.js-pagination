const { Client, Intents, MessageEmbed } = require('discord.js');
const { ButtonPaginationEmbed, PaginationEvents,
	ReactionPaginationEmbed, SelectPaginationEmbed } = require('../../src/index');


process.on('uncaughtException', function(err) {
	console.log('UNCAUGHT EXCEPTION:\n');
	console.log(err);
});

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS] });

client.once('ready', () => {
	console.log('Ready!');
});

client.on('messageCreate', async (message) => {
	if (message.content.includes('!p')) {
		const myPages = [];
		for (let i = 0; i < 10; i++) {
			const pageEmbed = new MessageEmbed();
			pageEmbed
				.setTitle(`This embed is index ${i}!`)
				.setDescription(`That means it is page #${i + 1}`);
			myPages.push(pageEmbed);
		}
		let paginationEmbed = null;
		if (message.content.startsWith('!pr')) {
			paginationEmbed = new ReactionPaginationEmbed(message, myPages);
		} else if (message.content.startsWith('!pb')) {
			paginationEmbed = new ButtonPaginationEmbed(message, myPages);
		} else if (message.content.startsWith('!ps')) {
			const selectOptions = [];
			for (let i = 0; i < 10; i++)
				selectOptions.push({
					label: `"Page #${i + 1}`,
					value: `${i}`,
					description: 'This will take you to page#' + i
				});
			paginationEmbed = new SelectPaginationEmbed(message, myPages, {
				selectMenuOptions: selectOptions
			});
		}
		paginationEmbed.on(PaginationEvents.PAGINATION_END, async ({ reason, paginator }) => {
			try {
				console.log('The pagination has ended: ' + reason);
				if (!paginator.message.deleted)
					await paginator.message.delete();
				if (!paginator.receivedPrompt.deleted)
					await paginator.receivedPrompt.delete();
			} catch (error) {
				console.log('There was an error when deleting the message: ');
				console.log(error);
			}
		}).on(PaginationEvents.COLLECT_ERROR, ({ error }) => console.log(error));
		return await (paginationEmbed.send()).message;
	}
});

client.on('interactionCreate', (interaction) => {
	// Prevent the client from collecting pagination interactions.
	// The prefix can be customised per pagination embed.
	if (interaction.customId && interaction.customId.startsWith('pagination'))
		return;
	console.log('CLIENT GOT AN INTERACTION: ' + interaction.customId);
});

client.login(process.env.BOT_TOKEN);