import { Module } from "../classes/module";
import { command } from "../classes/command";
import commandManager from '../manager/commandManager';
import interactionManager from "../manager/interactionManager";
import botManager from "../manager/botManager";
import { ChatInputCommandInteraction, TextChannel, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ActionRow, ButtonStyle, Interaction, ButtonInteraction, messageLink } from 'discord.js';
import { PermissionFlagsBits } from '@discordjs/core';
import databaseManager from '../manager/databaseManager';
import { interaction } from "../classes/interaction";
import axios from "axios";
import { LoNData, LoNImage, LoNPicture } from "../@types/LoN";

let CHANNELS:string[] = [];
export class LewdOrNsFW extends Module {

    constructor() {
        super("LewdOrNsFW");

        const LoNCommand = new command("lon", "Startet/Stoppt das Lewd oder NSFW Spiel in diesem Channel", this.addLoNChannel);
        LoNCommand.commandBuilder.setNSFW(true);
        LoNCommand.commandBuilder.setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);

        const LoNUpdateVoteCount = new command("lon-update", "Aktualisiert die Votes benötigt in dem Channel", this.updateVoteCount);
        LoNUpdateVoteCount.commandBuilder.setNSFW(true);
        LoNUpdateVoteCount.commandBuilder.setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);
        LoNUpdateVoteCount.commandBuilder.addIntegerOption(option => option.setName("votes").setDescription("Anzahl der Votes die benötigt werden").setRequired(true));

        const LoNAddPicture = new command("lon-add", "Fügt ein Bild zum Lewd oder NSFW Spiel hinzu", this.addLoNPicture);
        LoNAddPicture.commandBuilder.setNSFW(true);
        LoNAddPicture.commandBuilder.addStringOption(option => option.setName("url").setDescription("URL des Bildes").setRequired(true));

        const LoNForcePicture = new command("lon-force", "Erzwinge ein neues Bild zum Lewd oder NSFW Spiel hinzu", this.forceLoNPicture);
        LoNForcePicture.commandBuilder.setNSFW(true);
        LoNForcePicture.commandBuilder.setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);

        commandManager.registerCommand("lon", LoNCommand)
        commandManager.registerCommand("lon-update", LoNUpdateVoteCount)
        commandManager.registerCommand("lon-add", LoNAddPicture)
        commandManager.registerCommand("lon-force", LoNForcePicture)

        interactionManager.registerInteraction("lon-save", new interaction("lon-save", this.handleLoNInteraction));
        interactionManager.registerInteraction("lon-lewd", new interaction("lon-lewd", this.handleLoNInteraction));
        interactionManager.registerInteraction("lon-nsfw", new interaction("lon-nsfw", this.handleLoNInteraction));
        interactionManager.registerInteraction("lon-delete", new interaction("lon-delete", this.deleteLoNPicture));

        databaseManager.db.collection("LoN").find().toArray().then((data) => {
            CHANNELS = data.map((data) => data.channelID);
        });
    }

    async addLoNChannel(interaction: ChatInputCommandInteraction) {
        const collection = databaseManager.db.collection("LoN");
        const data = await collection.findOne({channelID: interaction.channelId});
        if(data) {
            collection.deleteOne({channelID: interaction.channelId});
            CHANNELS = CHANNELS.filter((channel) => channel !== interaction.channelId);
            interaction.reply({content: "Der Channel wurde erfolgreich entfernt!", ephemeral: true});
            return;
        }

        CHANNELS.push(interaction.channelId);
        databaseManager.db.collection("LoN").insertOne({channelID: interaction.channelId});
        interaction.reply({content: "Der Channel wurde erfolgreich hinzugefügt!", ephemeral: true});
        sendNextPicture(interaction.channelId);
    }

    async forceLoNPicture(interaction: ChatInputCommandInteraction) {
        const collection = databaseManager.db.collection<LoNData>("LoN-data");
        const data = await collection.findOne({channelID: interaction.channelId}, {sort: {$natural: -1}});
        if(!data) return interaction.reply({content: "Es wurde noch kein Bild in diesem Channel hinzugefügt!", ephemeral: true});
        
        await collection.updateOne({channelID: interaction.channelId, messageID: data.messageID}, {$set: {deleted: true}});
        sendNextPicture(interaction.channelId);
        return interaction.reply({content: "Das nächste Bild wurde erfolgreich gesendet!", ephemeral: true});
    }

    async updateVoteCount(interaction: ChatInputCommandInteraction) {
        const collection = databaseManager.db.collection<LoNData>("LoN-data");
        const votes = interaction.options.getInteger("votes");

        const data = await collection.findOne({channelID: interaction.channelId}, {sort: {$natural: -1}});
        if(!data) return interaction.reply({content: "Es wurde noch kein Bild in diesem Channel hinzugefügt!", ephemeral: true});
        
        // Update the Vote count
        await collection.updateOne({channelID: interaction.channelId, messageID: data.messageID}, {$set: {neededVotes: votes}});
        return interaction.reply({content: "Die benötigten Votes wurden erfolgreich aktualisiert!", ephemeral: true});
    }

    async addLoNPicture(interaction: ChatInputCommandInteraction) {
        const collection = databaseManager.db.collection<LoNPicture>("LoN-pictures");
        const url = interaction.options.getString("url");

        if(!url.endsWith(".png") && !url.endsWith(".jpg") && !url.endsWith(".jpeg") && !url.endsWith(".gif")) return interaction.reply({content: "Die URL muss auf ein Bild enden!", ephemeral: true});
        collection.insertOne({picture: url, channelID: interaction.channelId, done: false});
        interaction.reply({content: "Das Bild wurde der Queue erfolgreich hinzugefügt!", ephemeral: true});
    }

    async deleteLoNPicture(interaction: ButtonInteraction) {
        const collection = databaseManager.db.collection<LoNData>("LoN-data");
        const data = await collection.findOne({messageID: interaction.message.id});
        if(!data || data.deleted) return;
        const channel = await botManager.client.channels.fetch(data.channelID) as TextChannel;
        const message = await channel.messages.fetch(data.messageID);
        message.delete();
        collection.updateOne({messageID: interaction.message.id}, {$set: {deleted: true}});
        sendNextPicture(data.channelID);
    }

    async handleLoNInteraction(interaction: ButtonInteraction) {
        if(!CHANNELS.includes(interaction.channelId)) return interaction.reply({content: "Dieser Channel ist nicht für das Lewd oder NSFW Spiel freigegeben!", ephemeral: true});
        const collection = databaseManager.db.collection<LoNData>("LoN-data");
        const data = await collection.findOne({messageID: interaction.message.id});
        const type = interaction.customId.split("-")[1];
        if(!data) return;
        const newVotes = data.votes;
        if(newVotes.find((item) => item.userID == interaction.user.id)) return interaction.reply({content: "Du hast bereits abgestimmt!", ephemeral: true});
        newVotes.push({userID: interaction.user.id, vote: type});

        const messageContent = buildMessage(data.picture,
            newVotes.filter((item) => item.vote == "save").length,
            newVotes.filter((item) => item.vote == "lewd").length,
            newVotes.filter((item) => item.vote == "nsfw").length
        );

        if(newVotes.length >= data.neededVotes) {
            messageContent.embeds[0].addFields([{name: "Tags", value: data.picture.tags}])
            setTimeout(() => {
                sendNextPicture(data.channelID);                
            }, 3000);
        }
        
        const channel = await botManager.client.channels.fetch(data.channelID) as TextChannel;
        const message = await channel.messages.fetch(data.messageID);
        message.edit(messageContent);

        collection.updateOne({messageID: interaction.message.id}, {$set: {votes: newVotes}})
        interaction.deferUpdate();
    }
}

async function getPicture(channelID: string):Promise<LoNImage> {
    const collection = databaseManager.db.collection<LoNPicture>("LoN-pictures");
    const picture = await collection.findOne({done: false, channelID: channelID});
    if(picture) {
        await collection.updateOne({picture: picture.picture, channelID: channelID}, {$set: {done: true}});

        return {
            id: "custom_id",
            tags: "custom_picture",
            hasChildren: false,
            file_url: picture.picture,
            preview_url: picture.picture,
            source: picture.picture,
            rating: "e",
        }
    }

    const response = await axios.get("https://yande.re/post.json?limit=100&page=" + (Math.random() * 100))
    const data:LoNImage[] = response.data.filter((item: any) => (item.rating == "q" || item.rating == "e") && !item.has_children);
    const RNG = Math.floor(Math.random() * data.length);

    return data[RNG];
}

async function sendNextPicture(channel:string){
    if(!CHANNELS.includes(channel)) return;
    const picture = await getPicture(channel);
    const collection = databaseManager.db.collection<LoNData>("LoN-data");
    const lastPicture = await collection.findOne({channelID: channel, deleted: false}, {sort: {$natural: -1}});
    if(lastPicture && lastPicture.votes.length < lastPicture.neededVotes) return;

    const discordChannel = await botManager.client.channels.fetch(channel)
    if(!discordChannel.isTextBased()) return;
    const message = await (<TextChannel> discordChannel).send(buildMessage(picture, 0, 0, 0))
    collection.insertOne({
        channelID: channel,
        neededVotes: lastPicture? lastPicture.neededVotes : 3 ,
        votes: [],
        picture: picture,
        messageID: message.id,
        deleted: false
    })
}

function buildMessage(picture: LoNImage, save:number, lewd:number, nsfw:number){
    const embed = new EmbedBuilder()
        .setTitle("Lewd or NSFW")
        .setDescription("Stimme für das Bild ab, aber bedenke: Deine Stimme ist Final. Überleg es dir also genau!")
        .addFields([
            {name: 'Save', value: save.toString(), inline: true},
            {name: 'Lewd', value: lewd.toString(), inline: true},
            {name: 'NSFW', value: nsfw.toString(), inline: true},
        ])
        .setImage(picture.preview_url)
        .setColor("Red");
    
    const saveButton = new ButtonBuilder()
        .setCustomId("lon-save")
        .setLabel("Save")
        .setStyle(ButtonStyle.Success)
        

    const lewdButton = new ButtonBuilder()
        .setCustomId("lon-lewd")
        .setLabel("Lewd")
        .setStyle(ButtonStyle.Primary)
    
    const nsfwButton = new ButtonBuilder()
        .setCustomId("lon-nsfw")
        .setLabel("NSFW")
        .setStyle(ButtonStyle.Secondary)

    const ohShitButton = new ButtonBuilder()
        .setCustomId("lon-delete")
        .setLabel("DELETE ASAP!")
        .setStyle(ButtonStyle.Danger)

    const showPictureButton = new ButtonBuilder()
        .setURL(picture.file_url)
        .setLabel("Show Picture")
        .setStyle(ButtonStyle.Link)

    const row:any = new ActionRowBuilder()
        .setComponents(saveButton, lewdButton, nsfwButton, ohShitButton, showPictureButton)

    return {embeds: [embed], components: [row]};
}