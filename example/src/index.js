const { Client, Intents, MessageEmbed } = require('discord.js');
const { PaginationEvents, ReactionPaginationEmbed } = require('../../src/index');


process.on('uncaughtException', function(err) {
	console.log('UNCAUGHT EXCEPTION:\n');
	console.log(err);
});

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS] });

client.once('ready', () => {
	console.log('Ready!');
});

client.on('messageCreate', async (message) => {
	if (message.content.startsWith('!testreactions')) {
		const myPages = [];
		for (let i = 0; i < 10; i++) {
			const pageEmbed = new MessageEmbed();
			pageEmbed
				.setTitle(`This embed is index ${i}!`)
				.setDescription(`That means it is page #${i + 1}`);
			myPages.push(pageEmbed);
		}
		const reactionPaginationEmbed = new ReactionPaginationEmbed(message, myPages)
			.on(PaginationEvents.PAGINATION_END, async ({ reason, paginator }) => {
				try {
					console.clog('The pagination has ended: ' + reason);
					if (!paginator.message.deleted)
						await paginator.message.delete();
				} catch (error) {
					console.log('There was an error when deleting the message: ');
					console.log(error);
				}
			})
			.on(PaginationEvents.COLLECT_ERROR, ({ error }) => console.log(error));
		const sentMessage = await reactionPaginationEmbed.send();
		return sentMessage;
	}
});

client.login(process.env.BOT_TOKEN);