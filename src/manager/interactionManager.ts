import { GatewayDispatchEvents, InteractionType, Routes } from "@discordjs/core";
import botManager from "./botManager";
import { interaction } from "../classes/interaction";

const map:Map<string, interaction> = new Map();

botManager.client.on("interactionCreate", async (interaction) => {
    if(interaction.isCommand()) return;
    const command = map.get(interaction.id);
    command?.callBack(interaction);
})

async function registerInteraction(interactionName:string, interactionClass:interaction){
    map.set(interactionName, interactionClass)
    console.info("Registered Interaction: " + interactionName + "")
}

export default {
    registerInteraction
}