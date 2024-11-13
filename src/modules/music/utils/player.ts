import { AudioPlayer, AudioPlayerStatus, AudioResource, createAudioResource, joinVoiceChannel, VoiceConnection } from "@discordjs/voice";
import { musicFile } from "@prisma/client";
import * as ytldl from "@distube/ytdl-core";
import { VoiceChannel } from "discord.js";
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
	private loop: false | "song" | "playlist" = false;

	constructor(channel: VoiceChannel) {
		this.connection = joinVoiceChannel({
			channelId: channel.id,
			guildId: channel.guild.id,
			adapterCreator: channel.guild.voiceAdapterCreator
		})
		this.connection.subscribe(this.audio);

		this.audio.on(AudioPlayerStatus.Idle, () => {
			if (!this.playing) return;
			if (this.queue.length === 0) return this.playing = false;

			if(!this.loop) return this.play(this.queue.shift(), true);
			if(this.loop === "song") return this.play(this.currentSong, true);
			if(this.loop === "playlist") {
				this.queue.push(this.currentSong);
				return this.play(this.queue.shift(), true);
			}
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

	public setLoop(song: false | "song" | "playlist") {
		this.loop = song;
	}

	public isPlaying() {
		return this.playing;
	}

}