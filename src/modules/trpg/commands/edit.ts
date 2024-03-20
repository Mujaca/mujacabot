import { ChatInputCommandInteraction } from "discord.js";
import dbManager from "../../../manager/dbManager";
import { getCharacter, removeFromCache } from "../manager/playerManager";

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