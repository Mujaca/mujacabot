import { command } from "../../classes/command";
import { Module } from "../../classes/module";
import commandManager from "../../manager/commandManager";
import { musicConnectCommand } from "./commands/connect";
import { musicLoopCommand } from "./commands/loop";
import { musicStattusCommand } from "./commands/musicStatus";
import { musicPauseCommand } from "./commands/pause";
import { musicPlayCommand } from "./commands/play";
import { musicStopCommand } from "./commands/stop";

export class music extends Module {
	constructor() {
		super("music")
		const connectCommand = new command ("connect", "Verbinde den Bot mit deinem Channel", musicConnectCommand);
		connectCommand.commandBuilder.addChannelOption(option => option.setName("channel").setDescription("Der Channel mit dem du den Bot verbinden möchtest").setRequired(true));
		const playCommand = new command ("play", "Spiele Musik", musicPlayCommand);
		playCommand.commandBuilder.addStringOption(option => option.setName("url").setDescription("Die URL des Videos").setRequired(true));
		const pauseCommand = new command ("pause", "Pausiere die Musik", musicPauseCommand);
		const stopCommand = new command ("stop", "Stoppe die Musik", musicStopCommand);
		const loopCommand = new command ("loop", "Ändere den Loop-Modus", musicLoopCommand);
		loopCommand.commandBuilder.addStringOption(option => option.setName("mode").setDescription("Der Loop-Modus").setRequired(true).addChoices([
			{
				name: "Song (Wiederholt nur den Song)",
				value: "song"
			},
			{
				name: "Playlist (Packt den Song wieder zurück ans Ende)",
				value: "playlist"
			},
			{
				name: "Aus",
				value: "aus"
			}
		]));
		const shuffleCommand = new command ("shuffle", "Ändere den Shuffle-Modus", musicLoopCommand);
		shuffleCommand.commandBuilder.addStringOption(option => option.setName("mode").setDescription("Der Shuffle-Modus").setRequired(true).addChoices([
			{
				name: "random (Jedes mal einen zufälligen Song, schaltet auch den Loop-Modus auf Playlist)",
				value: "random"
			},
			{
				name: "Playlist (Mixt die komplette Playlist einmal durch)",
				value: "playlist"
			},
			{
				name: "Aus",
				value: "aus"
			}
		]));
		const musicStatusCommand = new command ("musicstatus", "Zeigt den aktuellen Status des Musikplayers", musicStattusCommand);

		commandManager.registerCommand("connect", connectCommand)
		commandManager.registerCommand("play", playCommand)
		commandManager.registerCommand("pause", pauseCommand)
		commandManager.registerCommand("stop", stopCommand)
		commandManager.registerCommand("loop", loopCommand)
		commandManager.registerCommand("shuffle", shuffleCommand)
		commandManager.registerCommand("musicstatus", musicStatusCommand)
	}
}