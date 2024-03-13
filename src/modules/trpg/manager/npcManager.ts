import { RPGNPC } from "@prisma/client";
import databaseManager from "../../../manager/dbManager";
import { generate } from "./aiManager";
import { ChatCompletionMessageParam } from "openai/resources";

const cache:Map<string, RPGNPC> = new Map();

cache.set("Liora", {
    cityID: 0,
    description: "In der malerischen Stadt Eldoria, bekannt für ihre üppigen Gärten, verwinkelten Pfade und die reichen Traditionen der Magie, lebt Liora Weisenblatt, eine freundliche Dame, die etwas abseits des geschäftigen Treibens der Stadt ihr Zuhause hat. Liora bewohnt ein kleines, aber gemütliches Haus am Rande des Elysischen Waldes, dessen Tür stets für Reisende und Stadtbewohner offensteht. Als hervorragende Kräuterkundlerin und Tränkemeisterin besitzt Liora ein umfangreiches Wissen über die Flora und Fauna der Region. Sie verbringt ihre Tage damit, seltene Kräuter zu sammeln, heilende Tränke zu brauen und sich um die Tiere des Waldes zu kümmern. Liora ist bei allen beliebt und bekannt für ihre unermüdliche Gastfreundschaft, ihre warmherzige Ausstrahlung und ihre Bereitschaft, denen in Not mit Rat und Tat zur Seite zu stehen. Ihr Haus dient als Zuflucht für diejenigen, die eine Pause von ihren Reisen oder den Wirren des Lebens suchen, und ihre Küche duftet stets nach frisch gebackenem Brot und Kräutertees. Trotz ihrer zurückgezogenen Lebensweise ist Liora eine unverzichtbare Stütze Eldorias, deren Weisheit und Güte die Herzen der Menschen erobert haben.",
    name: "Liora Weisenblatt",
    id: 0
})

export async function handleMessage(message:string) {
    if(!message.includes("@")) return null;

    const npc = await findNPC(message);
    if(!npc) return null;

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
        console.log(answerString)

        const answer = JSON.parse(answerString);
        answer.npc = npc;

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