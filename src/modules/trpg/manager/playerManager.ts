import { RPGCharacter } from "@prisma/client";
import dbManager from "../../../manager/dbManager";
import { findCurrentWorld } from "./worldManager";

const cache: Map<string, RPGCharacter> = new Map();

export async function getCharacter(userId: string): Promise<RPGCharacter | null> {
    const currentWorld = await findCurrentWorld();
    const characterCacheId = `${userId}-${currentWorld?.id || 0}`;
    if (cache.has(characterCacheId)) return cache.get(characterCacheId);

    const character = await dbManager.db.rPGCharacter.findFirst({
        where: {
            userID: userId,
            worldID: currentWorld?.id || 0
        },
    });
    if (character) cache.set(characterCacheId, character);
    return character;
}

export async function removeFromCache(userId: string) {
    const currentWorld = await findCurrentWorld();
    const characterCacheId = `${userId}-${currentWorld?.id || 0}`;
    cache.delete(characterCacheId);
}