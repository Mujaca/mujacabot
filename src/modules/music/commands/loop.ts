import { ChannelType, ChatInputCommandInteraction } from "discord.js";
import { getPlayer } from "../manager/playerManager";
import { loopType } from "../utils/player";

export async function musicLoopCommand(interaction: ChatInputCommandInteraction) {
if (interaction.channel.type !== ChannelType.GuildText) {
		return interaction.reply({ ephemeral: true, content: "Du kannst diesen Command nur in einem Server verwenden" });
	}

	const player = getPlayer(interaction.guild.id);
	if (!player) {
		return interaction.reply({ ephemeral: true, content: "Der Bot ist in keinem Channel! Bitte verbinde ihn erste" });
	}

	let mode:loopType|"aus" = interaction.options.getString("mode") as loopType|"aus";
	if(mode == "aus") mode = false;
	player.setLoop(mode);
	
	interaction.reply({ ephemeral: true, content: "Der Loop Modus wurde geändert!" });
}