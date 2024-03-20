import OpenAI from 'openai';
import databaseManager from '../../../manager/dbManager';
import { Chat, ChatCompletionMessageParam } from 'openai/resources';

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

const systemPrompts = {
	dialog: `
        Du bist ein System zur Unterstützung eines Text basierten RPGs. Du reagierst nur wenn du mit @npc angesprochen wirst. Du spricht und handelst für die NPCs. Alles was in Sternen (*) steht sind Aktionen die der Spieler ausführt. Du kannst auch mit solchen Sternen Aktionen andeuten.
        Solltest du eine Aktion ausführen die dem Spieler schaden zufügt, überlege dir eine passende Zahl. Die maximale HP ist 10. Sollte der NPC bei der Interaktion sterben, packe das auch dazu
        Du antwortest im folgenden Format:
        {
            "content": whatdoesthecharactersay,
            "damageToPlayer": derSchaden,
            "dead":boolean
        }
    `,
    memory: `
        Du bist ein System zur Erstellung von Erinnerungen der NPCs. Damit die NPCs sich an bestimmte Sachen erinnern können brauchen sie eine Erinnerung.

        Jede Erinnerung hat einen Namen, was sozusagen die Überschrift der Erinnerung ist.
        Dann gibt es einmal die Summary, welche die Erinnerung zusammenfasst und zu guter schluss eine mit der Erinnerung verbundene Emotion
    
        Du antwortest im folgenden Format:
    
        {
            "name": name,
            "summary": summary,
            "emotion":emotion
        }
    `,
	world: `
        Du bist Gott. Du erstellst mir auf Wunsch eine Welt in einem von mir ausgesuchtem Genre.

        Du antwortest im folgenden Format:
    
        {
            "name": name,
            "description": description
        }
    `,
	city: `
        Du bist Gott. Du erstellst für die Welt "([world])" im Genre "([genre])" eine Stadt. 

        Du antwortest im folgenden Format:
    
        {
            "name": name,
            "description": description
        }
    `,
	npc: `
        Du bist Gott. Du erstellst für die Welt "([world])" im Genre "([genre])" eine NPC der in einer Stadt Namens "([city])" wohnt
        Du antwortest im folgenden Format:

        {
            "name": name,
            "description": description
        }
    `,
    item: `
        Du bist Gott. Du erstellst für die Welt "Verdantia" im Genre "Fantasy" ein Item. Items die du erstellst müssen entweder ein damage oder ein armor wert haben. 
        Du antwortest im folgenden Format : 
        {
            "name": name,
            "description": description,
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
            "npc": npcName || "new"
        }
    `
};

export async function generate(type: keyof typeof systemPrompts, inputArr: ChatCompletionMessageParam[], toReplace: { [key: string]: string } = {}) {
	let system = systemPrompts[type];
	for (let key in toReplace) {
		system = system.replaceAll(`([${key}])`, toReplace[key]);
	}

    system += "Du wirst IMMER in Deutsch antworten"

	const input:ChatCompletionMessageParam[] = [{ role: 'system', content: systemPrompts[type] }, ...inputArr];

	const response = await openai.chat.completions.create({
		messages: input,
		model: 'gpt-4-turbo-preview',
		temperature: 0.8,
        frequency_penalty: 1.5,
		max_tokens: 1024,
	});

	databaseManager.db.aIUsage.create({
		data: {
			input: JSON.stringify(input),
			output: response.choices[0].message.content,
		},
	});

	return response.choices[0].message.content;
}
