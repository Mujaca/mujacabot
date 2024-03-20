import { ChatInputCommandInteraction, EmbedBuilder, TextChannel } from 'discord.js';
import botManager from '../../../manager/botManager';
import dbManager from '../../../manager/dbManager';
import webhooks from '../manager/webhookManager';

export async function addttrpgchannel(interaction: ChatInputCommandInteraction) {
	const channelID = interaction.options.getChannel('channel').id;
	const dbChannel = await dbManager.db.rPGChannel.findUnique({
		where: {
			channelID,
		},
	});

	if (dbChannel) {
		return await interaction.reply({
			content: 'Please contact @mujaca to remove this channel from the TTRPG Channels',
			ephemeral: true,
		});
	}

	const channel = await botManager.client.channels.fetch(channelID);
	if (!channel.isTextBased) return;
	const textChannel = channel as TextChannel;
	const webhook = await textChannel.createWebhook({
		name: 'TRPG',
	});

	await dbManager.db.rPGChannel.create({
		data: {
			channelID,
			webhookId: webhook.id,
			webhookToken: webhook.token,
		},
	});

	webhooks.set(channelID, webhook);

	await interaction.reply({
		content: 'This Channel was added as a TTRPG Channel!',
		ephemeral: true,
	});

	const embed = new EmbedBuilder();
	embed.setTitle('Thanks for using Gaia™!');
	embed.setDescription('Gaia™ is an experience to die for. You just need to create a character and then you can head right into the fun!');
	embed.setFields([
		{ name: '/trpg create Character [name]', value: 'Use this to get your very own Character!', inline: true },
		{ name: '/trpg help', value: 'Get an overview of eveything that is possible!', inline: true },
		{ name: 'Talk to NPCs', value: 'If you want to talk to an NPC use @[NPC Name] and then your message!' },
		{ name: 'Roleplay', value: 'Please have fun roleplaying with the others!', inline: true },
	]);
	embed.setColor('LuminousVividPink');
	embed.setFooter({
		text: 'vWZm kVnn Vpa! IdXco VggZn dno nj rdZ Zn nXcZdio.; 5',
		iconURL: 'https://as1.ftcdn.net/v2/jpg/02/79/04/26/1000_F_279042657_Q222qQOH4BaKzzdTtCP8g5nj6G8AzbDG.jpg',
	});
	embed.setImage('https://thumbs.dreamstime.com/b/spaceship-interior-dark-futuristic-control-room-generative-ai-inside-space-station-ship-window-desk-spacecraft-concept-265617840.jpg');

	const webhookMessage = await webhook.send({
		username: 'Gaia',
		avatarURL: 'https://as1.ftcdn.net/v2/jpg/02/79/04/26/1000_F_279042657_Q222qQOH4BaKzzdTtCP8g5nj6G8AzbDG.jpg',
		embeds: [embed],
	});
	await webhookMessage.pin();

	const messages = await dbManager.db.rPGMessage.findMany({
		take: 100,
	});
	for (let message of messages) {
		await webhook.send({
			content: message.content,
			username: message.username,
			avatarURL: message.profilePicture,
		});
	}
}
