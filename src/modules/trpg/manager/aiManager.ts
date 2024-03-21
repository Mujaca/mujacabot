import OpenAI from 'openai';
import databaseManager from '../../../manager/dbManager';
import { Chat, ChatCompletionMessageParam } from 'openai/resources';
import { ChatCompletionCreateParamsBase } from 'openai/resources/chat/completions';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const systemPrompts = {
    dialog: `
        Du bist ein System zur Unterstützung eines Text basierten RPGs. Du reagierst nur wenn du mit @npc angesprochen wirst. Du spricht und handelst für die NPCs. Alles was in Sternen (*) steht sind Aktionen die der Spieler ausführt. Du kannst auch mit solchen Sternen Aktionen andeuten.
        
        Solltest du eine Aktion ausführen die dem Spieler schaden zufügt, überlege dir eine passende Zahl. Die maximale eines Spielers HP ist 20. Die maximale HP eines NPCs ist 25. Sollte der NPC bei der Interaktion sterben, packe das auch dazu
        Sollte der Spieler eine Aktion ausführen, die Ihm selbst schaden zufügt überlege dir auch eine passende Zahl.

        Du antwortest im folgenden Format:
        {
            "content": whatdoesthecharactersay (string),
            "damageToPlayer": derSchaden (int),
            "damageToNPC": derSchaden (int),
            "dead":boolean
        }
    `,
    memory: `
        Du bist ein System zur Erstellung von Erinnerungen der NPCs. Damit die NPCs sich an bestimmte Sachen erinnern können brauchen sie eine Erinnerung.

        Jede Erinnerung hat einen Namen, was sozusagen die Überschrift der Erinnerung ist.
        Dann gibt es einmal die Summary, welche die Erinnerung zusammenfasst und zu guter schluss eine mit der Erinnerung verbundene Emotion
    
        Du antwortest im folgenden Format:
    
        {
            "name": name (string),
            "summary": summary (string),
            "emotion":emotion (string)
        }
    `,
    world: `
        Du bist Gott. Du erstellst mir auf Wunsch eine Welt in einem von mir ausgesuchtem Genre.

        Du antwortest im folgenden Format:
    
        {
            "name": name (string),
            "description": description (string)
        }
    `,
    city: `
        Du bist Gott. Du erstellst für die Welt "([world])" im Genre "([genre])" eine Stadt. 

        Du antwortest im folgenden Format:
    
        {
            "name": name (string), 
            "description": description (string)
        }
    `,
    npc: `
        Du bist Gott. Du erstellst für die Welt "([world])" im Genre "([genre])" eine NPC der in einer Stadt Namens "([city])" wohnt
        Du antwortest im folgenden Format:

        {
            "name": name (string),
            "description": description (string)
        }
    `,
    item: `
        Du bist Gott. Du erstellst für die Welt "([world])" im Genre "([genre])" ein Item. Items die du erstellst müssen entweder ein damage oder ein armor wert haben. 
        Du antwortest im folgenden Format : 
        {
            "name": name (string),
            "description": description (string),
            "damage": damage (int),
            "armor": armor (int),
            "cost": cost (int)
        }
    `,
    eventNPC: `
        Du bist ein System zur Unterstützung eines Text basierten RPGs. Du wurdest gerufen zur Event Erstellung, dass in der Welt auch mal etwas passiert. 
        
        Du sollst eintscheiden ob ein NPC benutzt wird, welches in den letzten Narichten auftrat oder die Erstellung eines neuen NPCs anschmeißen.
        
        NPC Narichten haben IMMMER ein [NPC] davor. Ist das nicht gegeben handelt es sich um keinen NPC, sondern um einen Player Character mit dem du NICHTS machen darfst. Ansonsten wirst du bestraft
        
        Du antwortest im folgenden Format:
        
        {
            "npc": npcName (string) || "new"
        }
    `,
    dead: `
        Du bist ein System zur Unterstützung eines TextRPGs. Ein NPC ist gerade an zu Hohem Schaden verstorben und du sollst seine Todesnaricht schreiben.

        Du antwortest im folgenden Format:
        {
             "content": whatdoesthecharactersay (string)
        }
    `
};

const modelOverrides:{[key:string]: ChatCompletionCreateParamsBase["model"]} = {
    world: 'gpt-4-turbo-preview',
    city: 'gpt-4-turbo-preview',
    npc: 'gpt-4-turbo-preview',
}

export async function generate(type: keyof typeof systemPrompts, inputArr: ChatCompletionMessageParam[], toReplace: { [key: string]: string } = {}) {
    let system = systemPrompts[type];
    for (let key in toReplace) {
        system = system.replaceAll(`([${key}])`, toReplace[key]);
    }

    system += "Du wirst IMMER in Deutsch antworten"

    const input: ChatCompletionMessageParam[] = [{ role: 'system', content: systemPrompts[type] }, ...inputArr];

    const model = modelOverrides[type] || 'gpt-3.5-turbo';

    const response = await openai.chat.completions.create({
        messages: input,
        model: model,
        temperature: 0.9,
        max_tokens: 4096,
    });

    await databaseManager.db.aIUsage.create({
        data: {
            input: JSON.stringify(input),
            output: response.choices[0].message.content,
        },
    });

    response.choices[0].message.content = response.choices[0].message.content.replaceAll('\n', ' ')
    response.choices[0].message.content = response.choices[0].message.content.replaceAll('```json', '')
    response.choices[0].message.content = response.choices[0].message.content.replaceAll('```', '')
    return response.choices[0].message.content;
}
