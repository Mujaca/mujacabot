import { RPGCharacter, RPGNPC } from "@prisma/client";
import databaseManager from "../../../manager/dbManager";
import { generate } from "./aiManager";
import { ChatCompletionMessageParam } from "openai/resources";
import { broadcast } from "./webhookManager";

const cache: Map<string, RPGNPC> = new Map();

export async function handleMessage(message: string, player: RPGCharacter) {
    if (!message.includes("@")) return null;

    const npc = await findNPC(message);
    if (!npc || npc.dead) return null;

    try {

        const messages = await databaseManager.db.rPGMessage.findMany({
            orderBy: {
                created_at: "asc",
            },
            take: 10
        });

        const mapped: ChatCompletionMessageParam[] = messages.map((message) => {
            return {
                role: message.username === "npc" ? 'system' : 'user',
                content: `${message.displayName}: ${message.content}`,
            }
        })

        mapped.unshift({
            role: 'system',
            content: `${npc.description}`
        })

        const answerString = await generate('dialog', mapped)
        const answer = JSON.parse(answerString);
        answer.npc = npc;

        console.log(answerString);

        if (answer.dead) {
            await databaseManager.db.rPGNPC.update({
                where: {
                    id: npc.id
                },
                data: {
                    dead: true
                }
            });

            cache.delete(npc.name);
        }

        if (!answer.damageToNPC) return answer;

        npc.HP -= answer.damageToNPC;
        await databaseManager.db.rPGNPC.update({
            where: {
                id: npc.id
            },
            data: {
                HP: {
                    decrement: answer.damageToNPC
                }
            }
        });

        if (npc.HP <= 0) letNPCDie(npc);

        return answer;

    } catch (error) {
        return null;
    }
}

export async function findNPC(messge: string) {
    const words = messge.split(" ");

    for (let word of words) {
        if (!word.includes("@")) continue;
        word = word.replace("@", "");

        if (cache.has(word)) return cache.get(word);
        const npc = await databaseManager.db.rPGNPC.findFirst({
            where: {
                name: word,
            }
        });
        if (npc) {
            cache.set(word, npc);
            return npc;
        }
    }

    return null;
}

async function letNPCDie(npc: RPGNPC) {
    const messages = await databaseManager.db.rPGMessage.findMany({
        orderBy: {
            created_at: "asc",
        },
        take: 25
    });

    const messageString = messages.map((message) => {
        return `${message.username == 'npc' ? '[NPC]' : ''} ${message.displayName}: ${message.content}`;
    }).join("\n");

    await databaseManager.db.rPGNPC.update({
        where: {
            id: npc.id
        },
        data: {
            dead: true
        }
    });
    cache.delete(npc.name);

    const deathMessage = await generate('dead', [
        { role: 'user', content: messageString }
    ])

    try {
        setTimeout(async () => {
            const deathObj = JSON.parse(deathMessage);

            await databaseManager.db.rPGMessage.create({
                data: {
                    content: deathObj.content,
                    username: 'npc',
                    displayName: npc.name,
                    profilePicture: "https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg"
                }
            });

            await broadcast(npc.name, deathObj.content);
        }, 10);
    } catch (error) {

    }
}