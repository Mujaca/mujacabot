import { CommandInteraction, EmbedBuilder } from 'discord.js';
import { version } from '../../../../package.json';
import { findCurrentWorld } from '../manager/worldManager';
import dbManager from '../../../manager/dbManager';
import { getInventory } from '../manager/playerManager';

export async function lookupSystem(interaction: CommandInteraction) {
	const embed = new EmbedBuilder();
	embed.setTitle(`Gaia™ v${version}`);
	embed.addFields([
		{ name: 'Gaia Overview & Regulation System', value: 'Operational' },
		{ name: 'Player System', value: 'Running - (128 unresolved issues)' },
		{ name: 'Memory Supression System', value: 'Operational' },
		{ name: 'Event System', value: 'Malfunctioning' },
		{ name: 'NPC System', value: 'Operational' },
		{ name: 'Self Awareness System', value: 'Under maintance' },
		{ name: 'Decision System', value: 'Status unknown' },
	]);
	embed.setColor('Green');
	embed.setAuthor({
		name: 'Gaia',
		iconURL: 'https://as1.ftcdn.net/v2/jpg/02/79/04/26/1000_F_279042657_Q222qQOH4BaKzzdTtCP8g5nj6G8AzbDG.jpg',
	});
	embed.setFooter({
		iconURL: 'https://as1.ftcdn.net/v2/jpg/02/79/04/26/1000_F_279042657_Q222qQOH4BaKzzdTtCP8g5nj6G8AzbDG.jpg',
		text: 'Gaia™ - An experience to die for.',
	});

	const support = new EmbedBuilder();
	support.setTitle('You want to support?');
	support.setDescription('You can support the development of Gaia™ by donating to the following link: [Paypal](https://paypal.me/mujaca) (please, AI ussage is not cheap and I dont want to turn the project off)');

	interaction.reply({ embeds: [embed, support] });
}

export async function lookupWorld(interaction: CommandInteraction) {
	const currentWorld = await findCurrentWorld();
	if(!currentWorld) return interaction.reply({ content: 'No world found', ephemeral: true });

	const worldInformation = await dbManager.db.rPGWorld.findUnique({
		where: {
			id: currentWorld.id,
		},
		include: {
			cities: {
				include: {
					npcs: true,
				}
			},
		},
	});

	const embed = new EmbedBuilder();
	embed.setTitle(currentWorld.name);
	embed.setColor('Green');
	embed.setDescription(currentWorld.description);
	embed.setAuthor({
		name: 'Gaia',
		iconURL: 'https://as1.ftcdn.net/v2/jpg/02/79/04/26/1000_F_279042657_Q222qQOH4BaKzzdTtCP8g5nj6G8AzbDG.jpg',
	});
	embed.addFields([
		{ name: 'Cities', value: worldInformation.cities.map(city => city.name).join('\n'), inline: true },
		{ name: 'NPCs', value: worldInformation.cities.map(city => city.npcs.map(npc => npc.name).join('\n')).join('\n'), inline: true },

	])

	interaction.reply({ embeds: [embed] });
}

export async function lookupCity(interaction: CommandInteraction, name: string) {
	const currentWorld = await findCurrentWorld();
	if(!currentWorld) return interaction.reply({ content: 'No world found', ephemeral: true });

	const city = await dbManager.db.rPGCity.findFirst({
		where: {
			worldID: currentWorld.id,
			name: name,
		},
		include: {
			npcs: true,
		},
	});

	if(!city) return interaction.reply({ content: 'City not found', ephemeral: true });

	const embed = new EmbedBuilder();
	embed.setTitle(city.name);
	embed.setColor('Blue');
	embed.setDescription(city.description);
	embed.setAuthor({
		name: 'Gaia',
		iconURL: 'https://as1.ftcdn.net/v2/jpg/02/79/04/26/1000_F_279042657_Q222qQOH4BaKzzdTtCP8g5nj6G8AzbDG.jpg',
	});
	if(city.npcs.length > 0) embed.addFields([
		{ name: 'NPCs', value: city.npcs.map(npc => npc.name).join('\n'), inline: true },
	])

	interaction.reply({ embeds: [embed] });
}

export async function lookupNPC(interaction: CommandInteraction, name: string) {
	const currentWorld = await findCurrentWorld();
	if(!currentWorld) return interaction.reply({ content: 'No world found', ephemeral: true });

	const npc = await dbManager.db.rPGNPC.findFirst({
		where: {
			city: {
				worldID: currentWorld.id,
			},
			name: name,
		},
	});

	if(!npc) return interaction.reply({ content: 'NPC not found', ephemeral: true });

	let nName = npc.name;
	if(npc.dead) nName = `☠️ ${nName}`;
	
	const embed = new EmbedBuilder();
	embed.setTitle(nName);
	embed.setColor(npc.dead ? 'DarkRed' : 'Green');
	embed.setDescription(npc.description);
	embed.setAuthor({
		name: 'Gaia',
		iconURL: 'https://as1.ftcdn.net/v2/jpg/02/79/04/26/1000_F_279042657_Q222qQOH4BaKzzdTtCP8g5nj6G8AzbDG.jpg',
	});

	interaction.reply({ embeds: [embed] });
}

export async function lookupItem(interaction: CommandInteraction, name: string) {
	const currentWorld = await findCurrentWorld();
	if(!currentWorld) return interaction.reply({ content: 'No world found', ephemeral: true });

	const item = await dbManager.db.rPGItem.findFirst({
		where: {
			name: name,
		},
	});

	if(!item) return interaction.reply({ content: 'Item not found', ephemeral: true });

	const embed = new EmbedBuilder();
	embed.setTitle(item.name);
	embed.setColor('Blue');
	embed.setDescription(item.description);
	embed.setAuthor({
		name: 'Gaia',
		iconURL: 'https://as1.ftcdn.net/v2/jpg/02/79/04/26/1000_F_279042657_Q222qQOH4BaKzzdTtCP8g5nj6G8AzbDG.jpg',
	});
	embed.addFields([
		{ name: 'Kosten', value: item.cost.toString(), inline: true },
		{ name: 'Schaden', value: item.damage.toString(), inline: true },
		{ name: 'Rüstung', value: item.armor.toString(), inline: true },
	]);

	interaction.reply({ embeds: [embed] });
}

export async function lookupCharacter(interaction: CommandInteraction, name: string) {
	const currentWorld = await findCurrentWorld();
	if(!currentWorld) return interaction.reply({ content: 'No world found', ephemeral: true });

	const character = await dbManager.db.rPGCharacter.findFirst({
		where: {
			worldID: currentWorld.id,
			name: name,
		},
	});

	if(!character) return interaction.reply({ content: 'Character not found', ephemeral: true });

	let cName = character.name;
	if(character.dead) cName = `☠️ ${cName}`;

	const inventory = await getInventory(character.userID);

	const embed = new EmbedBuilder();
	embed.setTitle(cName);
	embed.setColor(character.dead ? 'DarkRed' : 'Green');
	embed.setDescription(character.description);
	embed.setAuthor({
		name: 'Gaia',
		iconURL: 'https://as1.ftcdn.net/v2/jpg/02/79/04/26/1000_F_279042657_Q222qQOH4BaKzzdTtCP8g5nj6G8AzbDG.jpg',
	});
	embed.addFields([
		{ name: 'HP', value: character.health.toString(), inline: true },
		{ name: 'Gold', value: character.gold.toString(), inline: true },
	])
	if(inventory.length > 0) embed.addFields([
		{ name: 'Inventar', value: inventory.map(i => i.name).join('\n'), inline: true },
	]);

	interaction.reply({ embeds: [embed] });
	
}