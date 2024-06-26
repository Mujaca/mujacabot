import dbManager from "../../../manager/dbManager";
import { generate } from "./aiManager";

let chance = 1;

function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function shouldEventHappen() {
	const random = getRandomInt(0, 250);
	if (random > chance) {
		chance = 1;
		return true;
	}

	chance = chance + 1;
	return false;
}

export async function event() {
	return;
	if (!shouldEventHappen()) return;

	const messages = await dbManager.db.rPGMessage.findMany({
		take: 100
	})

	const messageString = messages.map((message) => {
		return `${message.username == 'npc' ? '[NPC]' : ''} ${message.displayName}: ${message.content}`
	}).join('\n')

	const summary = await generate('summary', [
		{ role: 'user', content: messageString }
	]);
	const summaryData = JSON.parse(summary);


}
