import { VoiceChannel } from "discord.js";
import { musicplayer } from "../utils/player";

const players:Map<string, musicplayer> = new Map();

export function getPlayer(guildId: string):musicplayer {
	let player = players.get(guildId);
	if(!player) return null;

	return player;
}

export function createPlayer(guildId: string, channel: VoiceChannel):musicplayer {
	let player = new musicplayer(channel);
	players.set(guildId, player);
	return player;
}

export function destroyPlayer(guildId: string):void {
	getPlayer(guildId)?.stop();
	players.delete(guildId);
}