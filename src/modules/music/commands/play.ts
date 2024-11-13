import { ChannelType, ChatInputCommandInteraction, VoiceChannel } from "discord.js";
import { createPlayer, getPlayer } from "../manager/playerManager";

const regEx = /^(http(s)??\:\/\/)?(www\.)?((youtube\.com\/watch\?v=)|(youtu.be\/))([a-zA-Z0-9\-_])+/;

export async function musicPlayCommand(interaction: ChatInputCommandInteraction) {
	if (interaction.channel.type !== ChannelType.GuildText) {
		return interaction.reply({ ephemeral: true, content: "Du kannst diesen Command nur in einem Server verwenden" });
	}

	const player = getPlayer(interaction.guild.id);
	if (!player) {
		return interaction.reply({ ephemeral: true, content: "Der Bot ist in keinem Channel! Bitte verbinde ihn erste" });
	}

	const url = interaction.options.getString("url");
	if (!regEx.test(url)) {
		return interaction.reply({ ephemeral: true, content: "Die URL ist nicht gültig" });
	}

	const reply = await interaction.deferReply({ ephemeral: true });
	const entry = await player.getVideoEntry(url);
	const playing = player.play(entry);
	reply.edit(`${playing ? "Spiele" : "Zur Warteliste hinzugefügt"}: ${entry.name}`);
}