import { command } from "../../classes/command";
import { Module } from "../../classes/module";
import commandManager from "../../manager/commandManager";
import { musicConnectCommand } from "./commands/connect";

export class music extends Module {
	constructor() {
		super("music")
		const connectCommand = new command ("connect", "Verbinde den Bot mit deinem Channel", musicConnectCommand);
		connectCommand.commandBuilder.addChannelOption(option => option.setName("channel").setDescription("Der Channel mit dem du den Bot verbinden möchtest").setRequired(true));
	
		commandManager.registerCommand("connect", connectCommand)
	}
}