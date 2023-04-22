import { command } from "../../classes/command";
import { Module } from "../../classes/module";
import commandManager from "../../manager/commandManager";
import { TCGdailyMoney } from "./commands/dailyMoney";
import databaseManager from "../../manager/databaseManager";
import playerDataManager from "./manager/playerDataManager";
import { playerData } from "../../@types/tcg";
import { TCGviewSet, TCGviewSetLast, TCGviewSetNext } from "./commands/viewSet";
import interactionManager from "../../manager/interactionManager";
import { interaction } from "../../classes/interaction";
import { TCGopenPack } from "./commands/openPack";

export class TCG extends Module {
    constructor() {
        super("TCG")

        const dailyMoney = new command("dailymoney", "Hole dir täglich 100$", TCGdailyMoney);
        
        const viewSet = new command("viewset", "Zeige dir ein Set", TCGviewSet);
        viewSet.commandBuilder.addStringOption(option => option.setName("set").setDescription("Das Set das du sehen möchtest").setRequired(true));

        const openPack = new command("openpack", "Öffne ein Boosterpack", TCGopenPack);
        openPack.commandBuilder.addStringOption(option => option.setName("set").setDescription("Das Set das du öffnen möchtest").setRequired(true));

        commandManager.registerCommand("dailymoney", dailyMoney)
        commandManager.registerCommand("viewset", viewSet)
        commandManager.registerCommand("openpack", openPack)
        interactionManager.registerInteraction("nextTCGCard", new interaction("nextTCGCard", TCGviewSetNext));
        interactionManager.registerInteraction("lastTCGCard", new interaction("lastTCGCard", TCGviewSetLast));

        this.onInit();
    }

    async onInit() {
        const playerCollection = databaseManager.db.collection<playerData>("TCGplayer");
        const players = await playerCollection.find().toArray();

        for(const player of players) {
            playerDataManager.getPlayer(player.userID);
        }

        
    }
}