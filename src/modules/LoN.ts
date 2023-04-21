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
import { LoNData, LoNImage } from "../@types/LoN";

export class LewdOrNsFW extends Module {

    constructor() {
        super("LewdOrNsFW");

        const LoNCommand = new command("lon", "Startet/Stoppt das Lewd oder NSFW Spiel in diesem Channel", this.addLoNChannel);
        LoNCommand.commandBuilder.setNSFW(true);
        LoNCommand.commandBuilder.setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);

        commandManager.registerCommand("lon", LoNCommand)
        interactionManager.registerInteraction("lon-save", new interaction("lon-save", this.handleLoNInteraction));
        interactionManager.registerInteraction("lon-lewd", new interaction("lon-lewd", this.handleLoNInteraction));
        interactionManager.registerInteraction("lon-nsfw", new interaction("lon-nsfw", this.handleLoNInteraction));
        interactionManager.registerInteraction("lon-delete", new interaction("lon-delete", this.deleteLoNPicture));
    }

    async addLoNChannel(interaction: ChatInputCommandInteraction) {
        //databaseManager.db.collection("LoN").insertOne({channelID: interaction.data.channel.id});
        interaction.reply({content: "Der Channel wurde erfolgreich hinzugefügt!"})
        sendNextPicture(interaction.channelId);
    }

    async deleteLoNPicture(interaction: ButtonInteraction) {
        const collection = databaseManager.db.collection<LoNData>("LoN-data");
        const data = await collection.findOne({messageID: interaction.message.id});
        if(!data) return;
        const channel = await botManager.client.channels.fetch(data.channelID) as TextChannel;
        const message = await channel.messages.fetch(data.messageID);
        message.delete();
        collection.updateOne({messageID: interaction.message.id}, {$set: {deleted: true}});
        sendNextPicture(data.channelID);
    }

    async handleLoNInteraction(interaction: ButtonInteraction) {
        const collection = databaseManager.db.collection<LoNData>("LoN-data");
        const data = await collection.findOne({messageID: interaction.message.id});
        const type = interaction.customId.split("-")[1];
        if(!data) return;
        const newVotes = data.votes;
        if(newVotes.find((item) => item.userID == interaction.user.id)) return interaction.reply({content: "Du hast bereits abgestimmt!", ephemeral: true});
        newVotes.push({userID: interaction.user.id, vote: type});

        if(newVotes.length == data.neededVotes) sendNextPicture(data.channelID);
        const messageContent = buildMessage(data.picture,
            newVotes.filter((item) => item.vote == "save").length,
            newVotes.filter((item) => item.vote == "lewd").length,
            newVotes.filter((item) => item.vote == "nsfw").length
        );

        const channel = await botManager.client.channels.fetch(data.channelID) as TextChannel;
        const message = await channel.messages.fetch(data.messageID);
        message.edit(messageContent);
        
        collection.updateOne({messageID: interaction.message.id}, {$set: {votes: newVotes}})
        //interaction.reply({content: "Deine Stimme wurde erfolgreich abgegeben!", ephemeral: true})
    }
}

async function getPicture():Promise<LoNImage> {
    const response = await axios.get("https://yande.re/post.json?limit=100&page=" + (Math.random() * 100))
    const data:LoNImage[] = response.data.filter((item: any) => (item.rating == "q" || item.rating == "e") && !item.has_children);
    const RNG = Math.floor(Math.random() * data.length);

    return data[RNG];
}

async function sendNextPicture(channel:string){
    const picture = await getPicture();
    const collection = databaseManager.db.collection("LoN-data");
    
    const discordChannel = await botManager.client.channels.fetch(channel)
    if(!discordChannel.isTextBased()) return;
    const message = await (<TextChannel> discordChannel).send(buildMessage(picture, 0, 0, 0))
    collection.insertOne({
        channelID: channel,
        neededVotes: 3,
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
        .setImage(picture.file_url)
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

    const row:any = new ActionRowBuilder()
        .setComponents(saveButton, lewdButton, nsfwButton, ohShitButton)

    return {embeds: [embed], components: [row]};
}