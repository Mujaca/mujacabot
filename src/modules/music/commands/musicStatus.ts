import { ChannelType, ChatInputCommandInteraction } from "discord.js";
import { getPlayer } from "../manager/playerManager";

export async function musicStattusCommand(interaction: ChatInputCommandInteraction) {
	if (interaction.channel.type !== ChannelType.GuildText) {
		return interaction.reply({ ephemeral: true, content: "Du kannst diesen Command nur in einem Server verwenden" });
	}

	const player = getPlayer(interaction.guild.id);
	if (!player) {
		return interaction.reply({ ephemeral: true, content: "Kann es sein, dass du irgendwie blöd bist?" });
	}

	const embed = player.getDiscordStatusEmobed();
	return interaction.reply({ embeds: [embed] });
}