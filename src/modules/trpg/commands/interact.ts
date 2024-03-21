import { ChatInputCommandInteraction } from "discord.js";
import dbManager from "../../../manager/dbManager";
import { getCharacter, removeFromCache } from "../manager/playerManager";

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