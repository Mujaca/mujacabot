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

    const checkCharacter = await dbManager.db.rPGCharacter.findFirst({
        where: {
            userID: userId,
            worldID: currentWorld.id
        }
    });

    if(checkCharacter) return interaction.reply({content: "Character already exists", ephemeral: true});

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

    await interaction.reply({content: "Character created", ephemeral: true});
    //TODO add DM Messages
}

export async function createCity(interaction: ChatInputCommandInteraction, characterName:string, description:string, city:null, userId: string) {
    const currentWorld = await findCurrentWorld();
    if(!currentWorld) return interaction.reply({content: "No world loaded", ephemeral: true});

    const checkCity = await dbManager.db.rPGCity.findFirst({
        where: {
            name: characterName,
            worldID: currentWorld.id
        }
    });

    if(checkCity) return interaction.reply({content: "City already exists", ephemeral: true});

    await dbManager.db.rPGCity.create({
        data: {
            name: characterName,
            description: description,
            worldID: currentWorld.id
        }
    });

    await interaction.reply({content: "City created", ephemeral: true});
}

export async function createNPC(interaction: ChatInputCommandInteraction, characterName:string, description:string, city:string, userId: string) {
    const currentWorld = await findCurrentWorld();
    if(!currentWorld) return interaction.reply({content: "No world loaded", ephemeral: true});

    const dbCity = await dbManager.db.rPGCity.findFirst({
        where: {
            name: city,
            worldID: currentWorld.id
        }
    });

    if(!dbCity) return interaction.reply({content: "City not found", ephemeral: true});

    const checkNPC = await dbManager.db.rPGNPC.findFirst({
        where: {
            name: characterName,
            cityID: dbCity.id
        }
    });

    if(checkNPC) return interaction.reply({content: "NPC already exists", ephemeral: true});

    await dbManager.db.rPGNPC.create({
        data: {
            name: characterName,
            description: description,
            cityID: dbCity.id
        }
    });

    await interaction.reply({content: "NPC created", ephemeral: true});
}

export async function createItem(interaction: ChatInputCommandInteraction, itemName:string, description:string, city:null, userId: string) {
    const currentWorld = await findCurrentWorld();
    if(!currentWorld) return interaction.reply({content: "No world loaded", ephemeral: true});

    const cost = interaction.options.getInteger('cost') || 0;
    const damage = interaction.options.getInteger('damage') || 0;
    const armor = interaction.options.getInteger('armor') || 0;

    const checkItem = await dbManager.db.rPGItem.findFirst({
        where: {
            name: itemName,
            worldID: currentWorld.id
        }
    });

    if(checkItem) return interaction.reply({content: "Item already exists", ephemeral: true});

    await dbManager.db.rPGItem.create({
        data: {
            name: itemName,
            description: description,
            cost: cost,
            damage: damage,
            armor: armor,
            worldID: currentWorld.id
        }
    });

    await interaction.reply({content: "Item created", ephemeral: true});
}