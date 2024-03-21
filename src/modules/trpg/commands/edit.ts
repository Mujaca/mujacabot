import { ChatInputCommandInteraction } from "discord.js";
import dbManager from "../../../manager/dbManager";
import { getCharacter, removeFromCache } from "../manager/playerManager";
import { findCurrentWorld } from "../manager/worldManager";

export async function editCharacter(interaction: ChatInputCommandInteraction, characterName:null, description:string, city:null, userId: string) {
    const character = await getCharacter(userId);

    if (!character || character.dead) return await interaction.reply({ content: "You don't have a character yet", ephemeral: true });
    
    await dbManager.db.rPGCharacter.update({
        where: {
            id: character.id,
        },
        data: {
            description: description || character.description,
        },
    });
    removeFromCache(userId);

    await interaction.reply({ content: "Character updated", ephemeral: true });
}

export async function editCity(interaction: ChatInputCommandInteraction, characterName:string, description:string, city:null, userId: null) {
    const world = await findCurrentWorld();

    const dbcity = await dbManager.db.rPGCity.findFirst({
        where: {
            name: city,
            worldID: world.id,
        },
    });

    if (!dbcity) return await interaction.reply({ content: "City not found", ephemeral: true });

    await dbManager.db.rPGCity.update({
        where: {
            id: dbcity.id,
        },
        data: {
            description: description || dbcity.description,
        },
    });

    await interaction.reply({ content: "City updated", ephemeral: true });
}

export async function editNPC(interaction: ChatInputCommandInteraction, characterName:string, description:string, city:string, userId: null) {
    const world = await findCurrentWorld();

    const dbnpc = await dbManager.db.rPGNPC.findFirst({
        where: {
            name: characterName,
            city: {
                worldID: world.id,
                name: city,
            },
        },
    });

    if (!dbnpc) return await interaction.reply({ content: "NPC not found", ephemeral: true });

    await dbManager.db.rPGNPC.update({
        where: {
            id: dbnpc.id,
        },
        data: {
            description: description || dbnpc.description,
        },
    });

    await interaction.reply({ content: "NPC updated", ephemeral: true });
}

export async function editItem(interaction: ChatInputCommandInteraction, itemName:string, description:string, city:string, userId: null) {
    const world = await findCurrentWorld();

    const dbitem = await dbManager.db.rPGItem.findFirst({
        where: {
            name: itemName,
            worldID: world.id,
        },
    });

    const cost = interaction.options.getInteger('cost');
    const damage = interaction.options.getInteger('damage');
    const armor = interaction.options.getInteger('armor');

    if (!dbitem) return await interaction.reply({ content: "Item not found", ephemeral: true });

    await dbManager.db.rPGItem.update({
        where: {
            id: dbitem.id,
        },
        data: {
            description: description || dbitem.description,
            cost: cost || dbitem.cost,
            damage: damage || dbitem.damage,
            armor: armor || dbitem.armor
        },
    });

    await interaction.reply({ content: "Item updated", ephemeral: true });
}