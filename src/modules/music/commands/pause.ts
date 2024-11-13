import { ChannelType, ChatInputCommandInteraction } from "discord.js";
import { getPlayer } from "../manager/playerManager";

export async function musicPauseCommand(interaction: ChatInputCommandInteraction) {
if (interaction.channel.type !== ChannelType.GuildText) {
		return interaction.reply({ ephemeral: true, content: "Du kannst diesen Command nur in einem Server verwenden" });
	}

	const player = getPlayer(interaction.guild.id);
	if (!player) {
		return interaction.reply({ ephemeral: true, content: "Der Bot ist in keinem Channel! Bitte verbinde ihn erste" });
	}

	if(!player.isPlaying()) {
		return interaction.reply({ ephemeral: true, content: "Der Bot ist bereits pausiert" });
	}

	player.pause();
	interaction.reply({ ephemeral: true, content: "Musik wurde pausiert" });
}