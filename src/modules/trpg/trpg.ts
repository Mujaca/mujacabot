import { ChannelType, ChatInputCommandInteraction, EmbedBuilder, Message, PermissionFlagsBits, WebhookClient } from 'discord.js';
import { Module } from '../../classes/module';
import botManager from '../../manager/botManager';
import { command } from '../../classes/command';
import { addttrpgchannel } from './commands/addChanel';
import commandManager from '../../manager/commandManager';
import dbManager from '../../manager/dbManager';
import webhooks, { broadcast } from './manager/webhookManager';
import { handleMessage } from './manager/npcManager';
import { event } from './manager/eventManager';
import { handleInteraction } from './manager/consoleManager';
import { lookupCharacter, lookupCity, lookupItem, lookupNPC, lookupSystem, lookupWorld } from './commands/lookup';
import { getCharacter } from './manager/playerManager';
import { createCity, createItem, createNPC, createPlayer } from './commands/create';
import { generateCity, generateItem, generateNPC } from './commands/generate';
import { editCharacter, editCity, editItem, editNPC } from './commands/edit';
import { damagePlayer, getGold, getItem, giveItem, removeGold, removeItem, sellItem } from './commands/interact';
import { saveFeedback } from './commands/feedback';

export class TRPG extends Module {
	constructor() {
		super('trpg');
		botManager.client.on('messageCreate', this.messageHandler);
		this.init()

		const addTTRPGChannel = new command('addttrpg', "Add's this Channel as a TTRPG Channel", addttrpgchannel);
		addTTRPGChannel.commandBuilder.addChannelOption((option) => option.setName('channel').setDescription('The Channel').addChannelTypes(ChannelType.GuildText).setRequired(true));
		addTTRPGChannel.commandBuilder.setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);


		const trpg = new command('ttrpg', "trpg Command", this.mainCommand);
		trpg.commandBuilder.addSubcommand(command =>
			command.setName('create')
				.setDescription('Create a Character, Item, City or NPC')
				.addStringOption(option => option.setName('type').setDescription('What you want to create').setChoices(
					{ name: 'Character', value: 'Character' },
					{ name: 'Item', value: 'Item' },
					{ name: 'City', value: 'City' },
					{ name: 'NPC', value: 'NPC' }
				).setRequired(true))
				.addStringOption(option => option.setName('name').setDescription('The name of the thing you want to create').setRequired(true))
				.addStringOption(option => option.setName('description').setDescription('The description of the thing you want to create').setRequired(true))
				.addStringOption(option => option.setName('city').setDescription('The city the character should live in.').setRequired(false))
				.addIntegerOption(option => option.setName('cost').setDescription('The cost of the item').setRequired(false))
				.addIntegerOption(option => option.setName('damage').setDescription('The damage of the item').setRequired(false))
				.addIntegerOption(option => option.setName('armor').setDescription('The armor of the item').setRequired(false))
		)

		trpg.commandBuilder.addSubcommand(command =>
			command.setName('generate')
				.setDescription('Generate a Character, Item, City or NPC')
				.addStringOption(option => option.setName('type').setDescription('What you want to generate').setChoices(
					{ name: 'Item', value: 'Item' },
					{ name: 'City', value: 'City' },
					{ name: 'NPC', value: 'NPC' }
				).setRequired(true))
				.addStringOption(option => option.setName('city').setDescription('The City the Character should live in.').setRequired(false))
		)

		trpg.commandBuilder.addSubcommand(command =>
			command.setName('edit')
				.setDescription('Edit a Character, Item, City or NPC')
				.addStringOption(option => option.setName('type').setDescription('What you want to edit').setChoices(
					{ name: 'Character', value: 'Character' },
					{ name: 'Item', value: 'Item' },
					{ name: 'City', value: 'City' },
					{ name: 'NPC', value: 'NPC' }
				).setRequired(true))
				.addStringOption(option => option.setName('name').setDescription('The Name of the thing you want to edit').setRequired(true))
				.addStringOption(option => option.setName('description').setDescription('The new description of the thing you want to edit').setRequired(true))
		)

		trpg.commandBuilder.addSubcommand(command =>
			command.setName('lookup')
				.setDescription('Lookup a Character, Item, City, NPC or information about the current World')
				.addStringOption(option => option.setName('type').setDescription('What you want to lookup').addChoices(
					{ name: 'Character', value: 'Character' },
					{ name: 'Item', value: 'Item' },
					{ name: 'City', value: 'City' },
					{ name: 'NPC', value: 'NPC' },
					{ name: 'World', value: 'World' },
					{ name: 'System', value: 'System' }
				).setRequired(true))
				.addStringOption(option => option.setName('name').setDescription('The Name of the thing you want to lookup').setRequired(false))
		)

		trpg.commandBuilder.addSubcommand(command =>
			command.setName('console')
				.setDescription('Gaias Console. Requires Super User Permission!')
				.addStringOption(option => option.setName('command').setDescription('The Command you want to execute').setRequired(true))
				.addStringOption(option => option.setName('args').setDescription('The Arguments for the Command').setRequired(false))
		)

		trpg.commandBuilder.addSubcommand(command =>
			command.setName('interact')
				.setDescription('Interact with the current World')
				.addStringOption(option => option.setName('type').setDescription('What Action you want to execute').addChoices(
					{ name: 'getGold', value: 'getGold' },
					{ name: 'removeGold', value: 'removeGold' },
					{ name: 'getItem', value: 'getItem' },
					{ name: 'sellItem', value: 'sellItem' },
					{ name: 'giveItem', value: 'giveItem' },
					{ name: 'removeItem', value: 'removeItem' },
					{ name: 'damagePlayer', value: 'damagePlayer' },
				).setRequired(true))
				.addStringOption(option => option.setName('ptarget').setDescription('The charactera you want to interact with').setRequired(false))
				.addStringOption(option => option.setName('itarget').setDescription('The item you want to interact with').setRequired(false))
				.addIntegerOption(option => option.setName('amount').setDescription('The amount of the action').setRequired(false))
		)

		trpg.commandBuilder.addSubcommand(command =>
			command.setName('feedback')
			.setDescription('Send Feedback to the Developer')
			.addStringOption(option => option.setName('feedback').setDescription('The Feedback you want to send').setRequired(true))
		)


		commandManager.registerCommand('ttrpg', trpg)
		commandManager.registerCommand('addttrpg', addTTRPGChannel);
	}

	async init() {
		const channels = await dbManager.db.rPGChannel.findMany({});
		for (let channel of channels) {
			webhooks.set(
				channel.channelID,
				new WebhookClient({
					id: channel.webhookId,
					token: channel.webhookToken,
				})
			);
		}
	}

	async messageHandler(message: Message<boolean>) {
		if (message.author.bot) return;
		const channel = await dbManager.db.rPGChannel.findUnique({
			where: {
				channelID: message.channelId,
			},
		});
		if (!channel) return;

		const character = await getCharacter(message.author.id);
		if (!character || character.dead) {
			await message.delete();
			return;
		}

		await dbManager.db.rPGMessage.create({
			data: {
				content: message.content,
				username: message.author.username,
				displayName: character.name,
				profilePicture: message.author.avatarURL(),
				worldID: character.worldID,
			}
		})

		const channels = await dbManager.db.rPGChannel.findMany({
			where: {
				NOT: {
					channelID: message.channelId,
				},
			},
		});
		event();

		for (let channel of channels) {
			webhooks.get(channel.channelID)?.send({
				content: message.content,
				username: character.name,
				avatarURL: message.author.avatarURL(),
			});
		}

		const answer = await handleMessage(message.content, character);
		if (answer === null) return;
		await broadcast(answer.npc.name, answer.content);

		await dbManager.db.rPGMessage.create({
			data: {
				content: answer.content || "",
				username: "npc",
				displayName: answer.npc.name,
				profilePicture: "https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg",
				worldID: character.worldID,
			}
		})
	}

	async mainCommand(interaction: ChatInputCommandInteraction) {
		const subcommand = interaction.options.getSubcommand();
		if (subcommand == 'console') return await handleInteraction(interaction);
		const type = interaction.options.getString('type') || '';

		const name = interaction.options.getString('name');
		const description = interaction.options.getString('description');
		const city = interaction.options.getString('city');

		const command = `${subcommand}-${type}`.toLowerCase();
		const commandCallbacks = {
			"create-character": createPlayer,
			"lookup-system": lookupSystem,
			"generate-npc": generateNPC,
			"generate-city": generateCity,
			"generate-item": generateItem,
			"lookup-world": lookupWorld,
			"lookup-city": lookupCity,
			"lookup-npc": lookupNPC,
			"lookup-item": lookupItem,
			"lookup-character": lookupCharacter,
			"create-city": createCity,
			"create-NPC": createNPC,
			"create-item": createItem,
			"edit-character": editCharacter,
			"edit-city": editCity,
			"edit-npc": editNPC,
			"edit-item": editItem,
			'interact-getGold': getGold,
			'interact-removeGold': removeGold,
			'interaction-getItem': getItem,
			'interaction-removeItem': removeItem,
			'interaction-sellItem': sellItem,
			'interaction-giveItem': giveItem,
			'interaction-damagePlayer': damagePlayer,
			'feedback-': saveFeedback
		}

		if (commandCallbacks[command]) return await commandCallbacks[command](interaction, name, description, city, interaction.user.id);

		return await interaction.reply({
			content: 'An error occured',
			ephemeral: true,
		});
	}
}
