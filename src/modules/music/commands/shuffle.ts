import { ChannelType, ChatInputCommandInteraction } from "discord.js";
import { getPlayer } from "../manager/playerManager";
import { shuffleType } from "../utils/player";

export async function musicShuffleCommand(interaction: ChatInputCommandInteraction) {
if (interaction.channel.type !== ChannelType.GuildText) {
		return interaction.reply({ ephemeral: true, content: "Du kannst diesen Command nur in einem Server verwenden" });
	}

	const player = getPlayer(interaction.guild.id);
	if (!player) {
		return interaction.reply({ ephemeral: true, content: "Der Bot ist in keinem Channel! Bitte verbinde ihn erste" });
	}

	let mode:shuffleType|"aus" = interaction.options.getString("mode") as shuffleType|"aus";
	if(mode == "aus") mode = false;
	player.setShuffle(mode);
	
	interaction.reply({ ephemeral: true, content: "Der Loop Modus wurde geändert!" });
}