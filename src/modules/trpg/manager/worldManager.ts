import { RPGWorld } from "@prisma/client";
import dbManager from "../../../manager/dbManager";

let currentWorld: RPGWorld | null = null;

export async function findCurrentWorld():Promise<RPGWorld>{
    if (currentWorld != null) return currentWorld;
    const world = await dbManager.db.rPGWorld.findFirst({
        where: {
            current: true,
        },
    });
    
    currentWorld = world;
    return world;
}

export async function setCurrentWorld(world: RPGWorld) {
    if (currentWorld) {
        await dbManager.db.rPGWorld.update({
            where: {
                id: currentWorld.id,
            },
            data: {
                current: false,
            },
        });
    }
    currentWorld = world;
    await dbManager.db.rPGWorld.update({
        where: {
            id: world.id,
        },
        data: {
            current: true,
        },
    });
}