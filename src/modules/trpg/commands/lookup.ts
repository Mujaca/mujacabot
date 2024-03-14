import { CommandInteraction, EmbedBuilder } from 'discord.js';
import { version } from '../../../../package.json';

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

	interaction.reply({ embeds: [embed] });
}
