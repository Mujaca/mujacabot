import { ChatInputCommandInteraction, EmbedBuilder, Message, PermissionFlagsBits, WebhookClient } from 'discord.js';
import { Module } from '../../classes/module';
import botManager from '../../manager/botManager';
import { command } from '../../classes/command';
import { addttrpgchannel } from './commands/addChanel';
import commandManager from '../../manager/commandManager';
import dbManager from '../../manager/dbManager';
import webhooks, { broadcast } from './manager/webhookManager';
import { handleMessage } from './manager/npcManager';
import { interaction } from '../../classes/interaction';

export class TRPG extends Module {
	constructor() {
		super('trpg');
		botManager.client.on('messageCreate', this.messageHandler);
        this.init()

		const addTTRPGChannel = new command('addttrpg', "Add's this Channel as a TTRPG Channel", addttrpgchannel);
		addTTRPGChannel.commandBuilder.addChannelOption((option) => option.setName('channel').setDescription('The Channel').setRequired(true));
		addTTRPGChannel.commandBuilder.setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);

        const trpg = new command('ttrpg', "trpg Command", this.mainCommand);
        trpg.commandBuilder.addSubcommand(command =>
            command.setName('create')
            .setDescription('Create a Character, Item, City or NPC')
			.addStringOption(option => option.setName('type').setDescription('Valid: \'Character\', \'Item\', \'City\', \'NPC\'').setRequired(true))
			.addStringOption(option => option.setName('name').setDescription('The Name of the thing you want to create').setRequired(true))
			.addStringOption(option => option.setName('description').setDescription('The description of the thing you want to create').setRequired(true))
        )
		trpg.commandBuilder.addSubcommand(command => 
			command.setName('edit')
			.setDescription('Edit a Character, Item, City or NPC')
			.addStringOption(option => option.setName('type').setDescription('Valid: \'Character\', \'Item\', \'City\', \'NPC\'').setRequired(true))
			.addStringOption(option => option.setName('name').setDescription('The Name of the thing you want to edit').setRequired(true))
			.addStringOption(option => option.setName('description').setDescription('The new description of the thing you want to edit').setRequired(true))
		)

		trpg.commandBuilder.addSubcommand(command =>
			command.setName('lookup')
			.setDescription('Lookup a Character, Item, City, NPC or information about the current World')
			.addStringOption(option => option.setName('type').setDescription('Valid: \'Character\', \'Item\', \'City\', \'NPC\', \'World\'').setRequired(true))
			.addStringOption(option => option.setName('name').setDescription('The Name of the thing you want to lookup').setRequired(false))
		)

		trpg.commandBuilder.addSubcommand(command =>
			command.setName('console')
			.setDescription('Gaias Console. Requires Super User Permission!')
			.addStringOption(option => option.setName('command').setDescription('The Command you want to execute').setRequired(true))
			.addStringOption(option => option.setName('args').setDescription('The Arguments for the Command').setRequired(false))
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

        await dbManager.db.rPGMessage.create({
            data: {
                content: message.content,
                username: message.author.username,
                displayName: message.author.displayName,
                profilePicture: message.author.avatarURL(),
            }
        })

		const channels = await dbManager.db.rPGChannel.findMany({
			where: {
				NOT: {
					channelID: message.channelId,
				},
			},
		});

		for (let channel of channels) {
			webhooks.get(channel.channelID)?.send({
				content: message.content,
				username: message.author.displayName,
				avatarURL: message.author.avatarURL(),
			});
		}

		const answer = await handleMessage(message.content);
		if(answer === null) return;

		broadcast(answer.npc.name, answer.content);
		await dbManager.db.rPGMessage.create({
			data: {
				content: answer.content || "",
				username: "npc",
				displayName: answer.npc.name,
				profilePicture: "https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg",
			}
		})
	}

    async mainCommand(interaction: ChatInputCommandInteraction) {
		const subcommand = interaction.options.getSubcommand();

		
		switch (subcommand) {
			case 'create':
				
			break;
			case 'edit':

			break;
			case 'lookup':

			break;
			case 'console':

			break;
			default:
				interaction.reply({ ephemeral: true, content: 'An Error Occured!'});
			break;
		}
    }
}
