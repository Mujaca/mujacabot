import dbManager from "../../../manager/dbManager";

let chance = 1;

function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function shouldEventHappen() {
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
	//if (!(await shouldEventHappen())) return;

  const messages = await dbManager.db.rPGMessage.findMany({
    take: 100
  })

  const messageString = messages.map((message) => {
    return `${message.username == 'npc' ? '[NPC]' : ''} ${message.displayName}: ${message.content}`
  }).join('\n')


}
