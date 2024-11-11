import { joinVoiceChannel, VoiceConnection } from "@discordjs/voice";
import { Channel, VoiceChannel } from "discord.js";

export class musicplayer {
	
	private connection:VoiceConnection;
	
	constructor(channel: VoiceChannel) {
		this.connection = joinVoiceChannel({
			channelId: channel.id,
			guildId: channel.guild.id,
			adapterCreator: channel.guild.voiceAdapterCreator
		})
	}
}