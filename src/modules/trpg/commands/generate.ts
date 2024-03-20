import { ChatInputCommandInteraction } from "discord.js";
import { generate } from "../manager/aiManager";
import { findCurrentWorld } from "../manager/worldManager";
import dbManager from "../../../manager/dbManager";

export async function generateNPC(interaction: ChatInputCommandInteraction, characterName: null, description: null, city: string, userId: string) {
    const currentWorld = await findCurrentWorld();
    if (!currentWorld) return interaction.reply({ content: "No world active", ephemeral: true });
    const cityEntry = await dbManager.db.rPGCity.findFirst({ where: { name: city } });
    if (!cityEntry) return interaction.reply({ content: "City not found", ephemeral: true });
    const reply = await interaction.deferReply({ ephemeral: true });

    const npcString = await generate('npc', [
        { role: 'user', content: cityEntry.description },
    ], {
        world: currentWorld.name,
        genre: currentWorld.genre,
        city: city
    })
    try {
        const npc = JSON.parse(npcString);
        await dbManager.db.rPGNPC.create({
            data: {
                name: npc.name,
                description: npc.description,
                cityID: cityEntry.id
            }
        });

        await reply.edit({ content: `NPC created: ${npc.name}` });
    } catch (error) {
        console.error(error);
        await reply.edit({
            content: "An error occured"
        });
    }
}

export async function generateCity(interaction: ChatInputCommandInteraction, characterName: null, description: null, city: null, userId: string) {
    const currentWorld = await findCurrentWorld();
    if (!currentWorld) return interaction.reply({ content: "No world active", ephemeral: true });
    const reply = await interaction.deferReply({ ephemeral: true });

    const cityString = await generate('city', [
        { role: 'user', content: currentWorld.description },
    ], {
        world: currentWorld.name,
        genre: currentWorld.genre,
    })

    try {
        const city = JSON.parse(cityString);
        await dbManager.db.rPGCity.create({
            data: {
                name: city.name,
                description: city.description,
                worldID: currentWorld.id
            }
        });

        await reply.edit({ content: `City created: ${city.name}` });
    } catch (error) {
        console.error(cityString);
        console.error(error);
        await reply.edit({
            content: "An error occured"
        });
    }
}

export async function generateItem(interaction: ChatInputCommandInteraction, characterName: null, description: null, city: null, userId: string) {
    const currentWorld = await findCurrentWorld();
    if (!currentWorld) return interaction.reply({ content: "No world active", ephemeral: true });
    const reply = await interaction.deferReply({ ephemeral: true });

    const itemString = await generate('item', [
        { role: 'user', content: currentWorld.description },
    ], {
        world: currentWorld.name,
        genre: currentWorld.genre,
    })

    try {
        const item = JSON.parse(itemString);
        await dbManager.db.rPGItem.create({
            data: {
                name: item.name,
                description: item.description,
                cost: item.cost,
                damage: item.damage,
                armor: item.armor,
                worldID: currentWorld.id
            }
        });

        await reply.edit({ content: `Item created: ${item.name}\n${item.description}` });
    } catch (error) {
        console.log(itemString, error);
        await reply.edit({ content: "An error occured" });
    }
}