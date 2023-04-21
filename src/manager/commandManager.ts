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
    //TODO change this to a better way of getting the application id & maybe guild id dynamic
    bodyArray.push(commandClass.getDiscordCommand())
    await botManager.rest.put(Routes.applicationGuildCommands("347650737741758465", "469780030483070977"), {
        body: bodyArray
    });
    await botManager.rest.put(Routes.applicationGuildCommands("347650737741758465", "1041336029396877362"), {
        body: bodyArray
    });
    console.error("Registered command: " + commandName + "")
}

export default {
    registerCommand
}