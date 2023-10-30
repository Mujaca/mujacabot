import { GatewayDispatchEvents, InteractionType, Routes } from "@discordjs/core";
import botManager from "./botManager";
import { command } from "../classes/command";
import { SlashCommandBuilder } from "discord.js";

const map:Map<string, command> = new Map();

botManager.client.on('interactionCreate', async (interaction) => {
    if(!interaction.isCommand()) return;
    const command = map.get(interaction.commandName);
    command?.callBack(interaction);
})

const bodyArray: SlashCommandBuilder[] = []
async function registerCommand(commandName:string, commandClass:command){
    map.set(commandName, commandClass)
    bodyArray.push(commandClass.getDiscordCommand())
    console.error("Registered command: " + commandName + "")
}

async function submitCommands() {
    await botManager.rest.put(Routes.applicationGuildCommands(process.env.APPLICATION_ID, process.env.TESTSERVER), {
        body: bodyArray
    });

    console.error("Submitted all Commands!")
}

export default {
    registerCommand,
    submitCommands
}