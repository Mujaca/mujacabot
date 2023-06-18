import { command } from "../../classes/command";
import { Module } from "../../classes/module";
import commandManager from "../../manager/commandManager";
import { PaProllDice } from "./commands/dice";

export class PaP extends Module {
    constructor() {
        super("PaP")

        const diceCommand = new command("dice", "Würfel", PaProllDice);
        diceCommand.commandBuilder.addBooleanOption(option => option.setName("silent").setDescription("Nur du siehst die Ausgabe").setRequired(false));
        diceCommand.commandBuilder.addIntegerOption(option => option.setName("dice").setDescription("Die Würfel die du würfeln möchtest (Standard D10)").setRequired(false));
        commandManager.registerCommand("dice", diceCommand)
    }
}