import { command } from "../../classes/command";
import { Module } from "../../classes/module";
import commandManager from "../../manager/commandManager";
import { auth } from "./commands/auth";
import { getWishStatistic } from "./commands/getWishStatistic";

export class StarRail extends Module{
    constructor() {
        super("StarRail");

        const authCommand = new command("starrail-auth", "Authentifiziere dich mit deinem StarRail Account", auth);
        authCommand.commandBuilder.addStringOption(option => option.setName("authkey").setDescription("Dein StarRail AuthKey").setRequired(true));
        const getWishStatisticCommand = new command("starrail-getWishStatistic", "Zeigt dir deine Wunschstatistik an", getWishStatistic);

        commandManager.registerCommand("starrail-auth", authCommand);
        commandManager.registerCommand("starrail-getwishstatistic", getWishStatisticCommand);
    }
}