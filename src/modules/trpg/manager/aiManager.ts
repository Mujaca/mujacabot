import OpenAI from 'openai';
import databaseManager from '../../../manager/dbManager';
import { ChatCompletionMessageParam } from 'openai/resources';

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
    `
};

export async function generate(type: keyof typeof systemPrompts, input: ChatCompletionMessageParam[], toReplace: { [key: string]: string } = {}) {
	let system = systemPrompts[type];
	for (let key in toReplace) {
		system = system.replaceAll(`([${key}])`, toReplace[key]);
	}

	input = [{ role: 'system', content: systemPrompts[type] }, ...input];

	const response = await openai.chat.completions.create({
		messages: input,
		model: 'gpt-4-turbo-preview',
		temperature: 1.5,
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
