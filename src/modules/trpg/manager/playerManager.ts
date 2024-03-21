import { RPGCharacter } from "@prisma/client";
import dbManager from "../../../manager/dbManager";
import { findCurrentWorld } from "./worldManager";
import botManager from "../../../manager/botManager";
import { EmbedBuilder } from "discord.js";
import { broadcast } from "./webhookManager";

const cache: Map<string, RPGCharacter> = new Map();

export async function getCharacter(userId: string): Promise<RPGCharacter | null> {
    const currentWorld = await findCurrentWorld();
    const characterCacheId = `${userId}-${currentWorld?.id || 0}`;
    if (cache.has(characterCacheId)) return cache.get(characterCacheId);

    const character = await dbManager.db.rPGCharacter.findFirst({
        where: {
            userID: userId,
            worldID: currentWorld?.id || 0
        }
    });
    if (character) cache.set(characterCacheId, character);
    return character;
}

export async function removeFromCache(userId: string) {
    const currentWorld = await findCurrentWorld();
    const characterCacheId = `${userId}-${currentWorld?.id || 0}`;
    cache.delete(characterCacheId);
}

export async function getInventory(userId: string) {
    const character = await getCharacter(userId);
    const inventory = await dbManager.db.rPGItem.findMany({
        where: {
            owned: {
                some: {
                    id: character.id,
                }
            }
        },
    });
    return inventory;
}

export async function damagePlayer(player: RPGCharacter, damage: number) {
    const playerInventore = await getInventory(player.userID);
    let highestArmor = 0;
    for (let item of playerInventore) {
        if (item.armor > highestArmor) highestArmor = item.armor;
    }

    damage = Math.floor(damage / (1 - highestArmor));
    player.health -= damage;
    console.log(player.health, damage, highestArmor);
    if (player.health <= 0) {
        removeFromCache(player.userID);

        const embed = new EmbedBuilder();
        embed.setTitle("You died");
        embed.setDescription("You're character died. You can still spectate the game, but you can't interact with it anymore. \nSadly I can't log you out of the game, because we got an ongoing issue with the player system. This is also the reason, why you can't create a new character. \nSorry for the inconvenience.\nfsi ltti qttp ns ymj Atni. Dtz Bnqq sjji ny.; 5");
        embed.setColor("DarkRed");
        sendDMToPlayer(player.userID, embed);

        broadcast(player.name, `${player.name} fällt Tod zu Boden. Nach seinem letzten Atemzug, verlässt sein Geist seinen Körper und sein Körper löst sich langsam auf. Ihr könnt nichts mehr für ihn tun.`, "https://as1.ftcdn.net/v2/jpg/02/79/04/26/1000_F_279042657_Q222qQOH4BaKzzdTtCP8g5nj6G8AzbDG.jpg");

        return await dbManager.db.rPGCharacter.update({
            where: {
                id: player.id,
            },
            data: {
                dead: true,
                health: 0,
            },
        });
    }


    await dbManager.db.rPGCharacter.update({
        where: {
            id: player.id,
        },
        data: {
            health: player.health
        },
    });
}

export async function sendDMToPlayer(userId: string, embed: EmbedBuilder) {
    const user = await botManager.client.users.fetch(userId);
    await user.send({ embeds: [embed] });
}