import { AudioPlayer, AudioPlayerStatus, AudioResource, createAudioResource, joinVoiceChannel, VoiceConnection } from "@discordjs/voice";
import { musicFile } from "@prisma/client";
import * as ytldl from "@distube/ytdl-core";
import { EmbedBuilder, VoiceChannel } from "discord.js";
import * as fs from "fs";
import dbManager from "../../../manager/dbManager";

if (!fs.existsSync('./music/')) fs.mkdirSync('./music/');

export class musicplayer {

	private connection: VoiceConnection;
	private audio: AudioPlayer = new AudioPlayer();
	private resource: AudioResource;

	private playing: boolean = false;
	private currentSong: musicFile;
	private queue: musicFile[] = [];
	private loop: loopType = false;
	private shuffle: shuffleType = false;

	constructor(channel: VoiceChannel) {
		this.connection = joinVoiceChannel({
			channelId: channel.id,
			guildId: channel.guild.id,
			adapterCreator: channel.guild.voiceAdapterCreator
		})
		this.connection.subscribe(this.audio);

		this.audio.on(AudioPlayerStatus.Idle, () => {
			if (!this.playing) return;
			if (this.queue.length === 0 && this.loop == false) return this.playing = false;

			const nextSong = this.getNextSong();
			return this.play(nextSong, true);
		});
	}

	play(file: musicFile, queuedSong:boolean = false):boolean {
		if(this.playing && !queuedSong) {
			this.queue.push(file);

			return false;
		}

		const resource = createAudioResource(file.cached);
		this.audio.play(resource);
		this.connection.subscribe(this.audio);
		
		this.currentSong = file;
		this.resource = resource;
		this.playing = true;

		return true;
	}

	async getVideoEntry(url: string): Promise<musicFile> {
		const regEx = /(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/user\/\S+|\/ytscreeningroom\?v=|\/sandalsResorts#\w\/\w\/.*\/))([^\/&]{10,12})/;
		const youtubeId = regEx.exec(url);

		let file = await dbManager.db.musicFile.findFirst({
			where: {
				youtubeId: youtubeId[1]
			}
		});
		if (file && file.cached) return file;

		const info = await ytldl.getInfo(url);

		if (!file) file = await dbManager.db.musicFile.create({
			data: {
				youtubeId: youtubeId[1],
				name: info.videoDetails.title,
				url: `https://${info.videoDetails.video_url}`
			}
		});

		// @ts-ignore
		const downloadTarget = ytldl(url, { filter: "audioonly" });
		//@ts-ignore
		const stream = downloadTarget.pipe(fs.createWriteStream(`./music/${youtubeId[1]}.mp3`));
		await new Promise((resolve, reject) => {
			stream.on("finish", resolve);
			stream.on("error", reject);
		});

		file = await dbManager.db.musicFile.update({
			where: {
				id: file.id
			},
			data: {
				cached: `./music/${youtubeId[1]}.mp3`
			}
		});

		return file;
	}

	public pause() {
		this.audio.pause();
		this.playing = false;
	}

	public stop() {
		this.audio.stop();
		this.connection.disconnect();
		this.playing = false;
		this.currentSong = null;
	}

	public setLoop(song: loopType) {
		this.loop = song;
	}

	public setShuffle(shuffle: shuffleType) {
		this.shuffle = shuffle;

		if(this.shuffle === "playlist") this.queue = this.queue.sort(() => Math.random() - 0.5);
		if(this.shuffle === "random") this.setLoop("playlist");
	}

	public isPlaying() {
		return this.playing;
	}

	public getDiscordStatusEmobed():EmbedBuilder {
		const embed = new EmbedBuilder();
		embed.setColor("Green");
		embed.setTitle("Music Player");
		embed.addFields([
			{
				name: "Playing",
				value: this.currentSong ? this.currentSong.name : "Nothing"
			},
			{
				name: "Queue",
				value: this.queue.slice(0, 5).map((song, index) => `${index + 1}. ${song.name}`).join("\n") || "Empty"
			},
			{
				name: "Loop",
				value: this.loop ? this.loop : "Off",
				inline: true
			},
			{
				name: "Shuffle",
				value: this.shuffle ? this.shuffle : "Off",
				inline: true
			}
		])
		embed.setTimestamp();

		return embed
	}

	private getNextSong(): musicFile {
		if (this.loop === "song") return this.currentSong;
		if (this.loop === "playlist") this.queue.push(this.currentSong);

		if (this.shuffle === "random") {
			const randomIndex = Math.floor(Math.random() * this.queue.length);
			return this.queue.splice(randomIndex, 1)[0];
		}

		return this.queue.shift();
	}

}

export type loopType = false | "song" | "playlist";
export type shuffleType = false | "random" | "playlist";