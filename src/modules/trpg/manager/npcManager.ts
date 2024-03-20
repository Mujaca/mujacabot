import { RPGNPC } from "@prisma/client";
import databaseManager from "../../../manager/dbManager";
import { generate } from "./aiManager";
import { ChatCompletionMessageParam } from "openai/resources";

const cache:Map<string, RPGNPC> = new Map();

export async function handleMessage(message:string) {
    if(!message.includes("@")) return null;

    const npc = await findNPC(message);
    if(!npc || npc.dead) return null;

    try {

        const messages = await databaseManager.db.rPGMessage.findMany({
            orderBy: {
                created_at: "asc",
            },
            take: 10
        });

        const mapped:ChatCompletionMessageParam[] = messages.map((message) => {
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

        if(answer.dead) {
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

        return answer;

    } catch (error){
        return null;
    }
}

export async function findNPC(messge:string) {
    const words = messge.split(" ");

    for(let word of words) {
        if(!word.includes("@")) continue;
        word = word.replace("@", "");

        if(cache.has(word)) return cache.get(word);
        const npc = await databaseManager.db.rPGNPC.findFirst({
            where: {
                name: word,
            }
        });
        if(npc) {
            cache.set(word, npc);
            return npc;
        }
    }

    return null;

}