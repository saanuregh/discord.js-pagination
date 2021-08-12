const { Client, Intents, MessageEmbed } = require('discord.js');
const { ReactionPaginationEmbed } = require('../../src/index');

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
		const reactionPaginationEmbed = new ReactionPaginationEmbed(message, myPages, {collectErrorHandler: ({ error }) => console.log('Error on collect\n' + error) });
		const sentMessage = await reactionPaginationEmbed.send();
		return sentMessage;
	}
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;
	if (interaction.isMessageComponent) console.log('THis was a message component interaction.');

	if (interaction.commandName === 'ping') {
		await interaction.reply('Pong!');
	} if (interaction.commandName === 'testreactions') {
		// const myPages = [];

		// for (let i = 0; i < 10; i++) {
		// 	const pageEmbed = new MessageEmbed();
		// 	pageEmbed
		// 		.setTitle(`This embed is index ${i}!`)
		// 		.setDescription(`That means it is page #${i + 1}`);
		// 	myPages.push(pageEmbed);
		// }
	}
});

client.login(process.env.BOT_TOKEN);