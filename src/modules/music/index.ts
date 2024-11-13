import { command } from "../../classes/command";
import { Module } from "../../classes/module";
import commandManager from "../../manager/commandManager";
import { musicConnectCommand } from "./commands/connect";
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

		commandManager.registerCommand("connect", connectCommand)
		commandManager.registerCommand("play", playCommand)
		commandManager.registerCommand("pause", pauseCommand)
		commandManager.registerCommand("stop", stopCommand)
	}
}