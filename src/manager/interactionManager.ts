import { GatewayDispatchEvents, InteractionType, Routes } from "@discordjs/core";
import botManager from "./botManager";
import { interaction } from "../classes/interaction";
import { ButtonInteraction } from "discord.js";

const map:Map<string, interaction> = new Map();

botManager.client.on("interactionCreate", async (interaction) => {
    let interactionID;

    if(interaction.isCommand()) return;
    if(interaction.isButton()) interactionID = (<ButtonInteraction> interaction).customId;

    const command = map.get(interactionID);
    command?.callBack(interaction);
})

async function registerInteraction(interactionName:string, interactionClass:interaction){
    map.set(interactionName, interactionClass)
    console.info("Registered Interaction: " + interactionName + "")
}

export default {
    registerInteraction
}