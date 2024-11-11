import { ChannelType, ChatInputCommandInteraction, VoiceChannel } from "discord.js";
import { createPlayer, getPlayer } from "../manager/playerManager";

export async function musicConnectCommand(interaction: ChatInputCommandInteraction) {
	let channel = interaction.options.getChannel("channel");
	if (channel.type !== ChannelType.GuildVoice) {
		return interaction.reply({ ephemeral: true, content: "Du musst einen Voice Channel angeben!" });
	}
	channel = <VoiceChannel> channel;

	const player = getPlayer(channel.guild.id);
	if (player) {
		return interaction.reply({ ephemeral: true, content: "Der Bot ist bereits in einem Channel!" });
	}

	createPlayer(channel.guild.id, channel);
	interaction.reply({ ephemeral: true, content: "Der Bot wurde erfolgreich verbunden!" });
}