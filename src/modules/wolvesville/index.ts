import { command } from "../../classes/command";
import { Module } from "../../classes/module";
import commandManager from "../../manager/commandManager";
import { addWolvesvilleChannel } from "./commands/infoChannel";

export class wolvesville extends Module {
    constructor() {
        super("Wolvesville");
        
        const addChannel = new command("addwwochannel", "Fügt einen WWO Info Channel hinzu", addWolvesvilleChannel);
        addChannel.commandBuilder.addChannelOption(option => option.setName('channel').setDescription('Der Channel').setRequired(true));

        commandManager.registerCommand("addwwochannel", addChannel);
    }
}