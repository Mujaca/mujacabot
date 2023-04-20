import { GatewayDispatchEvents, InteractionType, Routes } from "@discordjs/core";
import botManager from "./botManager";
import { command } from "../classes/command";

const map:Map<string, command> = new Map();

botManager.client.on(GatewayDispatchEvents.InteractionCreate, async (interaction) => {
    if(interaction.data.type != InteractionType.ApplicationCommand) return;
    // @ts-ignore
    const command = map.get(interaction.data.data?.name);
    command?.callBack(interaction);
})

async function registerCommand(commandName:string, commandClass:command){
    map.set(commandName, commandClass)
    //TODO change this to a better way of getting the application id & maybe guild id dynamic
    await botManager.rest.put(Routes.applicationGuildCommands("347650737741758465", "469780030483070977"), {
        body: [
            commandClass.getDiscordCommand()
        ]
    });
    console.error("Registered command: " + commandName + "")
}

export default {
    registerCommand
}