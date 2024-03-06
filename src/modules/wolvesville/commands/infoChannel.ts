import { ChatInputCommandInteraction, TextChannel } from 'discord.js';
import botManager from '../../../manager/botManager';
import databaseManager from '../../../manager/dbManager';

export async function addWolvesvilleChannel(interaction: ChatInputCommandInteraction) {
	const channelID = interaction.options.getChannel('channel').id;
	if (!channelID)
		return interaction.reply({
			content: 'Du musst einen Channel angeben!',
			ephemeral: true,
		});

	const channel: TextChannel = <TextChannel>await botManager.client.channels.fetch(channelID);
	if (!channel.isTextBased())
		return interaction.reply({
			content: 'Der Channel muss ein Textchannel sein!',
			ephemeral: true,
		});

	const infoChannel = await databaseManager.db.wolvesvilleInfoChannel.findFirst({
		where: {
			channelID: channelID,
		},
	});

	if (infoChannel) {
		await databaseManager.db.wolvesvilleInfoChannel.delete({
			where: {
				id: infoChannel.id,
			},
		});
		return await interaction.reply({ content: 'Der Channel wurde entfernt!', ephemeral: true });
	}

	await databaseManager.db.wolvesvilleInfoChannel.create({
		data: {
			channelID: channelID,
		},
	});
	
	return await interaction.reply({ content: 'Der Channel wurde hinzugefügt!', ephemeral: true });
}
