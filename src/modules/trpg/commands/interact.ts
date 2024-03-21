import { ChatInputCommandInteraction } from "discord.js";
import dbManager from "../../../manager/dbManager";
import { getCharacter, getInventory, removeFromCache } from "../manager/playerManager";
import { findCurrentWorld } from "../manager/worldManager";
import { RPGCharacter } from "@prisma/client";
import * as playerManager from '../manager/playerManager'

export async function getGold(interaction: ChatInputCommandInteraction) {
    const amount = interaction.options.getInteger("amount");
    if(!amount) return await interaction.reply({ content: "Please provide an amount", ephemeral: true });

    const character = await getCharacter(interaction.user.id);
    if(!character) return await interaction.reply({ content: "You don't have a character yet", ephemeral: true });
    if(character.dead) return await interaction.reply({ content: "You are dead", ephemeral: true });

    await dbManager.db.rPGCharacter.update({
        where: {
            id: character.id,
        },
        data: {
            gold: character.gold + amount,
        },
    });

    removeFromCache(interaction.user.id);
    interaction.reply({ content: `You now have ${character.gold + amount} gold`, ephemeral: true });
}

export async function removeGold(interaction: ChatInputCommandInteraction) {
    const amount = interaction.options.getInteger("amount");
    if(!amount) return await interaction.reply({ content: "Please provide an amount", ephemeral: true });

    const character = await getCharacter(interaction.user.id);
    if(!character) return await interaction.reply({ content: "You don't have a character yet", ephemeral: true });
    if(character.dead) return await interaction.reply({ content: "You are dead", ephemeral: true });

    let gold = character.gold - amount;
    if(gold < 0) return await interaction.reply({ content: "You don't have enough gold", ephemeral: true });

    await dbManager.db.rPGCharacter.update({
        where: {
            id: character.id,
        },
        data: {
            gold: gold,
        },
    });

    removeFromCache(interaction.user.id);
    interaction.reply({ content: `You now have ${gold} gold`, ephemeral: true });
}

export async function getItem(interaction: ChatInputCommandInteraction) {
    const item = interaction.options.getString("itarget");
    if(!item) return await interaction.reply({ content: "Please provide an item", ephemeral: true });

    const currentWorld =  await findCurrentWorld();
    const character = await getCharacter(interaction.user.id);
    if(!character) return await interaction.reply({ content: "You don't have a character yet", ephemeral: true });
    if(character.dead) return await interaction.reply({ content: "You are dead", ephemeral: true });

    const findItem = await dbManager.db.rPGItem.findFirst({
        where: {
            name: item,
            worldID:currentWorld.id
        },
    });

    if(!findItem) return await interaction.reply({ content: "Item not found", ephemeral: true });

    await dbManager.db.rPGCharacter.update({
        where: {
            id: character.id,
        },
        data: {
            inventory: {
                connect: {
                    id: findItem.id,
                }
            },
        },
    });

    removeFromCache(interaction.user.id);
    interaction.reply({ content: `You now have ${item} in your inventory`, ephemeral: true });
}

export async function removeItem(interaction: ChatInputCommandInteraction) {
    const item = interaction.options.getString("itarget");
    if(!item) return await interaction.reply({ content: "Please provide an item", ephemeral: true });

    const currentWorld =  await findCurrentWorld();
    const character = await getCharacter(interaction.user.id);
    if(!character) return await interaction.reply({ content: "You don't have a character yet", ephemeral: true });
    if(character.dead) return await interaction.reply({ content: "You are dead", ephemeral: true });

    const findItem = await dbManager.db.rPGItem.findFirst({
        where: {
            name: item,
            worldID:currentWorld.id
        },
    });

    if(!findItem) return await interaction.reply({ content: "Item not found", ephemeral: true });
    if(!await findInInventory(character, item)) return await interaction.reply({ content: "You don't have this item in your inventory", ephemeral: true });

    await dbManager.db.rPGCharacter.update({
        where: {
            id: character.id,
        },
        data: {
            inventory: {
                disconnect: {
                    id: findItem.id,
                }
            },
        },
    });

    removeFromCache(interaction.user.id);
    interaction.reply({ content: `You no longer have ${item} in your inventory`, ephemeral: true });
}

export async function sellItem(interaction: ChatInputCommandInteraction) {
    const item = interaction.options.getString("itarget");
    if(!item) return await interaction.reply({ content: "Please provide an item", ephemeral: true });

    const currentWorld =  await findCurrentWorld();
    const character = await getCharacter(interaction.user.id);
    if(!character) return await interaction.reply({ content: "You don't have a character yet", ephemeral: true });
    if(character.dead) return await interaction.reply({ content: "You are dead", ephemeral: true });

    const findItem = await dbManager.db.rPGItem.findFirst({
        where: {
            name: item,
            worldID:currentWorld.id
        },
    });

    if(!findItem) return await interaction.reply({ content: "Item not found", ephemeral: true });
    if(!await findInInventory(character, item)) return await interaction.reply({ content: "You don't have this item in your inventory", ephemeral: true });

    await dbManager.db.rPGCharacter.update({
        where: {
            id: character.id,
        },
        data: {
            inventory: {
                disconnect: {
                    id: findItem.id,
                }
            },
            gold: character.gold + findItem.cost,
        },
    });

    removeFromCache(interaction.user.id);
    interaction.reply({ content: `You sold ${item} for ${findItem.cost} gold`, ephemeral: true });
}

export async function giveItem(interaction: ChatInputCommandInteraction) {
    const item = interaction.options.getString("itarget");
    if(!item) return await interaction.reply({ content: "Please provide an item", ephemeral: true });
    const target = interaction.options.getString("ptarget");
    if(!target) return await interaction.reply({ content: "Please provide a target", ephemeral: true });

    const currentWorld =  await findCurrentWorld();
    const character = await getCharacter(interaction.user.id);
    if(!character) return await interaction.reply({ content: "You don't have a character yet", ephemeral: true });

    const findItem = await dbManager.db.rPGItem.findFirst({
        where: {
            name: item,
            worldID:currentWorld.id
        },
    });

    if(!findItem) return await interaction.reply({ content: "Item not found", ephemeral: true });

    const findTarget = await dbManager.db.rPGCharacter.findFirst({
        where: {
            name: target,
            worldID:currentWorld.id,
            dead: false,
        },
    });

    if(!findTarget) return await interaction.reply({ content: "Target not found", ephemeral: true });
    if(!await findInInventory(character, item)) return await interaction.reply({ content: "You don't have this item in your inventory", ephemeral: true });

    await dbManager.db.rPGCharacter.update({
        where: {
            id: character.id,
        },
        data: {
            inventory: {
                disconnect: {
                    id: findItem.id,
                }
            },
        },
    });

    await dbManager.db.rPGCharacter.update({
        where: {
            id: findTarget.id,
        },
        data: {
            inventory: {
                connect: {
                    id: findItem.id,
                }
            },
        },
    });

    removeFromCache(interaction.user.id);
    removeFromCache(findTarget.userID);
    interaction.reply({ content: `You gave ${item} to ${target}`, ephemeral: true });
}

async function findInInventory(character:RPGCharacter, itemName: string) {
    const inventory = await getInventory(character.userID);
    return inventory.find(i => i.name === itemName);
}

export async function damagePlayer(interaction: ChatInputCommandInteraction) {
    const amount = interaction.options.getInteger("amount");
    if(!amount) return await interaction.reply({ content: "Please provide an amount", ephemeral: true });
    const target = interaction.options.getString("ptarget");
    if(!target) return await interaction.reply({ content: "Please provide a target", ephemeral: true });

    const currentWorld =  await findCurrentWorld();
    const character = await getCharacter(interaction.user.id);
    if(!character) return await interaction.reply({ content: "You don't have a character yet", ephemeral: true });
    if(character.dead) return await interaction.reply({ content: "You are dead", ephemeral: true });

    const findTarget = await dbManager.db.rPGCharacter.findFirst({
        where: {
            name: target,
            worldID:currentWorld.id,
            dead: false,
        },
    });

    if(!findTarget) return await interaction.reply({ content: "Target not found", ephemeral: true });

    const health = await playerManager.damagePlayer(findTarget, amount);
    interaction.reply({ content: `${target} now has ${health} health`, ephemeral: true });
}