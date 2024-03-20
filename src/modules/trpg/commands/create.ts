import { ChatInputCommandInteraction } from "discord.js";
import botManager from "../../../manager/botManager";
import dbManager from "../../../manager/dbManager";
import { findCurrentWorld } from "../manager/worldManager";

export async function createPlayer(interaction: ChatInputCommandInteraction, characterName:string, description:null, city:null, userId: string) {
    const currentWorld = await findCurrentWorld();
    if(!currentWorld) return interaction.reply({content: "No world loaded", ephemeral: true});

    const discrodUser = botManager.client.users.cache.get(userId);

    const botUser = await dbManager.db.botUser.upsert({
        where: {
            id: userId,
        },
        update: {},
        create: {
            id: userId,
            name: discrodUser?.username,
        },
    })

    await dbManager.db.rPGCharacter.create({
        data: {
            userID: userId,
            name: characterName,
            description: description,
            dead: false,
            gold: 0,
            health: 10,
            maxHealth: 10,
            xp: 0,
            worldID: currentWorld.id
        }
    });

    interaction.reply({content: "Character created", ephemeral: true});
}