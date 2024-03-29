import { Module } from "../classes/module";
import { command } from "../classes/command";
import commandManager from '../manager/commandManager';
import interactionManager from "../manager/interactionManager";
import botManager from "../manager/botManager";
import { ChatInputCommandInteraction, TextChannel, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ActionRow, ButtonStyle, Interaction, ButtonInteraction, messageLink, Message, InteractionResponse } from 'discord.js';
import { PermissionFlagsBits } from '@discordjs/core';
import databaseManager from '../manager/dbManager';
import { interaction } from "../classes/interaction";
import axios from "axios";
import { LoNData, LoNImage, LoNPicture } from "../@types/LoN";
import { LoNBookmark } from "@prisma/client";

let CHANNELS:string[] = [];
const bookmarkMessages:Map<string, bookmarkGalarey> = new Map();

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

        const LoNStatistics = new command("lon-statistics", "Zeigt die Statistiken des Lewd oder NSFW Spiels an", this.getStatistics);
        LoNStatistics.commandBuilder.setNSFW(true);

        const ownLoNStatistics = new command("lon-own-statistics", "Zeigt deine Statistiken des Lewd oder NSFW Spiels an", this.getOwnStatistics);
        ownLoNStatistics.commandBuilder.setNSFW(true);

        const LoNBookmarks = new command("lon-bookmarks", "Zeigt deine Lesezeichen an", this.showBookmarks);
        LoNBookmarks.commandBuilder.setNSFW(true);

        commandManager.registerCommand("lon", LoNCommand)
        commandManager.registerCommand("lon-update", LoNUpdateVoteCount)
        commandManager.registerCommand("lon-add", LoNAddPicture)
        commandManager.registerCommand("lon-force", LoNForcePicture)
        commandManager.registerCommand("lon-statistics", LoNStatistics)
        commandManager.registerCommand("lon-own-statistics", ownLoNStatistics)
        commandManager.registerCommand("lon-bookmarks", LoNBookmarks)

        interactionManager.registerInteraction("lon-save", new interaction("lon-save", this.handleLoNInteraction));
        interactionManager.registerInteraction("lon-lewd", new interaction("lon-lewd", this.handleLoNInteraction));
        interactionManager.registerInteraction("lon-nsfw", new interaction("lon-nsfw", this.handleLoNInteraction));
        interactionManager.registerInteraction("lon-delete", new interaction("lon-delete", this.deleteLoNPicture));
        interactionManager.registerInteraction("lon-bookmark", new interaction("lon-bookmark", this.handleBookmarkInteraction));
        interactionManager.registerInteraction("lon-previeous", new interaction("lon-previeous", this.previeousBookmark));
        interactionManager.registerInteraction("lon-next", new interaction("lon-next", this.nextBookmark));
        interactionManager.registerInteraction("lon-delete-bookmark", new interaction("lon-delete-bookmark", this.deleteBookmark));

        databaseManager.db.loNChannel.findMany().then((data) => {
            CHANNELS = data.map((data) => data.channelID);
        });
    }

    async addLoNChannel(interaction: ChatInputCommandInteraction) {
        const channel = await databaseManager.db.loNChannel.findUnique({where: {channelID: interaction.channelId}});
        if(channel) {
            await databaseManager.db.loNChannel.delete({where: {channelID: interaction.channelId}});
            CHANNELS = CHANNELS.filter((channel) => channel !== interaction.channelId);
            interaction.reply({content: "Der Channel wurde erfolgreich entfernt!", ephemeral: true});
            return;
        }

        CHANNELS.push(interaction.channelId);
        await databaseManager.db.loNChannel.create({data: {channelID: interaction.channelId}});
        interaction.reply({content: "Der Channel wurde erfolgreich hinzugefügt!", ephemeral: true});
        sendNextPicture(interaction.channelId);
    }

    async forceLoNPicture(interaction: ChatInputCommandInteraction) {
        const data = await databaseManager.db.loNData.findMany({where: {channelID: interaction.channelId}, orderBy: {messageID: "desc"}});
        if(!data && data.length == 0) return interaction.reply({content: "Es wurde noch kein Bild in diesem Channel hinzugefügt!", ephemeral: true});
        
        //await databaseManager.db.loNData.update({where: {channelID: interaction.channelId, messageID: data[0].messageID}, data: {deleted: true}});
        await sendNextPicture(interaction.channelId);
        return interaction.reply({content: "Das nächste Bild wurde erfolgreich gesendet!", ephemeral: true});
    }

    async updateVoteCount(interaction: ChatInputCommandInteraction) {
        const votes = interaction.options.getInteger("votes");

        const data = await databaseManager.db.loNData.findMany({where: {channelID: interaction.channelId}, orderBy: {messageID: "desc"}});
        if(!data) return interaction.reply({content: "Es wurde noch kein Bild in diesem Channel hinzugefügt!", ephemeral: true});
        
        // Update the Vote count
        await databaseManager.db.loNData.updateMany({where: {channelID: interaction.channelId, messageID: data[0].messageID}, data: {neededVotes: votes}});
        return interaction.reply({content: "Die benötigten Votes wurden erfolgreich aktualisiert!", ephemeral: true});
    }

    async getStatistics(interaction: ChatInputCommandInteraction) {
        const data = await databaseManager.db.loNData.findMany({where: {channelID: interaction.channelId}, include: {votes: true}});
        const embed = new EmbedBuilder();

        const summary = {
            save: 0,
            lewd: 0,
            nsfw: 0
        }

        for(let entry of data.filter((entry) => !entry.deleted)) {
            const save = entry.votes.filter((interaction) => interaction.vote === "save").length;
            const lewd = entry.votes.filter((interaction) => interaction.vote === "lewd").length;
            const nsfw = entry.votes.filter((interaction) => interaction.vote === "nsfw").length;

            if(save > lewd && save >= nsfw) summary.save++;
            if(lewd > save && lewd >= nsfw) summary.lewd++;
            if(nsfw > save && nsfw >= lewd) summary.nsfw++;
        }

        embed.setTitle("Statistiken");
        embed.setDescription(`Insgesamt wurden ${data.length} Bilder gesendet!`);
        embed.addFields([
            {name: "Normale Bilder", value: `${summary.save} (${(summary.save / data.length * 100).toFixed(2)}%)`, inline: true},
            {name: "Lewd Bilder", value: `${summary.lewd} (${(summary.lewd / data.length * 100).toFixed(2)}%)`, inline: true},
            {name: "NSFW Bilder", value: `${summary.nsfw} (${(summary.nsfw / data.length * 100).toFixed(2)}%)`, inline: true},
            {name: "Gelöschte Bilder", value: `${data.filter((entry) => entry.deleted).length} (${(data.filter((entry) => entry.deleted).length / data.length * 100).toFixed(2)}%)`, inline: true}
        ]);
        embed.setColor("DarkAqua");

        interaction.reply({embeds: [embed]});
    }

    async getOwnStatistics(interaction: ChatInputCommandInteraction) {
        const userID = interaction.user.id;
        const embed = new EmbedBuilder();
        const data = (await databaseManager.db.loNData.findMany({where: {channelID: interaction.channelId}, include: {votes: true}})).filter((entry) => !entry.deleted);
        const summary = {
            save: 0,
            lewd: 0,
            nsfw: 0
        }
        type summaryType = keyof typeof summary;

        for(let entry of data) {
            const votes = entry.votes.filter(vote => vote.userID === userID);
            if(votes.length == 0) continue;
            const vote:summaryType = votes[0].vote as summaryType;
            summary[vote]++;
        }

        embed.setTitle("Statistiken");
        embed.setDescription(`Insgesamt hast du an ${data.length} Abstimmung teilgenommen!`);
        embed.addFields([
            {name: "\"Save\" Votes", value: `${summary.save} (${(summary.save / data.length * 100).toFixed(2)}%)`, inline: true},
            {name: "\"Lewd\" Votes", value: `${summary.lewd} (${(summary.lewd / data.length * 100).toFixed(2)}%)`, inline: true},
            {name: "\"NSFW\" Votes", value: `${summary.nsfw} (${(summary.nsfw / data.length * 100).toFixed(2)}%)`, inline: true},
        ]);
        embed.setColor("DarkAqua");

        interaction.reply({embeds: [embed], ephemeral: true});
    }

    async addLoNPicture(interaction: ChatInputCommandInteraction) {
        const url = interaction.options.getString("url");

        if(!url.endsWith(".png") && !url.endsWith(".jpg") && !url.endsWith(".jpeg") && !url.endsWith(".gif")) return interaction.reply({content: "Die URL muss auf ein Bild enden!", ephemeral: true});
        databaseManager.db.loNCustomPicture.create({data: {picture: url, done: false}});
        interaction.reply({content: "Das Bild wurde der Queue erfolgreich hinzugefügt!", ephemeral: true});
    }

    async deleteLoNPicture(interaction: ButtonInteraction) {
        const data = await databaseManager.db.loNData.findUnique({where: {messageID: interaction.message.id}});
        if(!data || data.deleted) return;
        const channel = await botManager.client.channels.fetch(data.channelID) as TextChannel;
        const message = await channel.messages.fetch(data.messageID);
        message.delete();
        await databaseManager.db.loNData.update({where: {messageID: interaction.message.id}, data: {deleted: true}})
        await databaseManager.db.loNBookmark.deleteMany({where: {pictureID: data.pictureID}});
        sendNextPicture(data.channelID);
    }

    async handleLoNInteraction(interaction: ButtonInteraction) {
        if(!CHANNELS.includes(interaction.channelId)) return interaction.reply({content: "Dieser Channel ist nicht für das Lewd oder NSFW Spiel freigegeben!", ephemeral: true});
        const data = await databaseManager.db.loNData.findUnique({where: {messageID: interaction.message.id}, include: {votes: true, picture: true}});
        const type = interaction.customId.split("-")[1];
        if(!data) return;
        const newVotes = data.votes as {userID: string, vote: string}[];
        if(newVotes.find((item) => item.userID == interaction.user.id)) return interaction.reply({content: "Du hast bereits abgestimmt!", ephemeral: true});
        newVotes.push({userID: interaction.user.id, vote: type});
        await databaseManager.db.loNVotes.create({data: {userID: interaction.user.id, vote: type, dataID: data.id}})

        const messageContent = buildMessage(data.picture,
            newVotes.filter((item) => item.vote == "save").length,
            newVotes.filter((item) => item.vote == "lewd").length,
            newVotes.filter((item) => item.vote == "nsfw").length,
            newVotes.length >= data.neededVotes ? data.picture.tags : undefined
        );

        if(newVotes.length == data.neededVotes) {
            setTimeout(() => {
                sendNextPicture(data.channelID);                
            }, 1500);
        }
        
        const channel = await botManager.client.channels.fetch(data.channelID) as TextChannel;
        const message = await channel.messages.fetch(data.messageID);
        message.edit(messageContent);
        interaction.deferUpdate();
    }

    async handleBookmarkInteraction(interaction: ButtonInteraction) {
        const data = await databaseManager.db.loNData.findUnique({where: {messageID: interaction.message.id}, include: {picture: true}});
        let user = await databaseManager.db.botUser.findUnique({where: {id: interaction.user.id}});

        if(!user) user = await databaseManager.db.botUser.create({data: {id: interaction.user.id, name: interaction.user.username}});
        const bookmark = await databaseManager.db.loNBookmark.findFirst({where: {userID: user.id, pictureID: data.picture.id}});

        if(bookmark) return interaction.reply({content: "Das Bild ist bereits in deinen Lesezeichen!", ephemeral: true});


        await databaseManager.db.loNBookmark.create({data: {userID: user.id, pictureID: data.picture.id}});
        interaction.reply({content: "Das Bild wurde erfolgreich zu deinen Lesezeichen hinzugefügt!", ephemeral: true});
    }

    async showBookmarks(interaction: ChatInputCommandInteraction) {
        const user = await databaseManager.db.botUser.findUnique({where: {id: interaction.user.id}});
        if(!user) return interaction.reply({content: "Du hast noch keine Lesezeichen!", ephemeral: true});
        const bookmarks = await databaseManager.db.loNBookmark.findMany({where: {userID: user.id}, include: {picture: true}});
        if(bookmarks.length == 0) return interaction.reply({content: "Du hast noch keine Lesezeichen!", ephemeral: true});
        const firstBookmark = bookmarks[0];

        const embed = new EmbedBuilder();
        embed.setTitle("Lesezeichen " + (1) + "/" + bookmarks.length);
        embed.setDescription(firstBookmark.picture.tags);
        embed.setImage(firstBookmark.picture.preview_url);
        embed.setColor("DarkAqua");

        const previeousButton = new ButtonBuilder()
        .setCustomId("lon-previeous")
        .setLabel("←")
        .setStyle(ButtonStyle.Primary)

        const nextButton = new ButtonBuilder()
        .setCustomId("lon-next")
        .setLabel("→")
        .setStyle(ButtonStyle.Primary)

        const deleteButton = new ButtonBuilder()
        .setCustomId("lon-delete-bookmark")
        .setLabel("Löschen")
        .setStyle(ButtonStyle.Danger)

        const showPictureButton = new ButtonBuilder()
        .setURL(firstBookmark.picture.file_url)
        .setLabel("Show Picture")
        .setStyle(ButtonStyle.Link)

    const row:any = new ActionRowBuilder()
        .setComponents(previeousButton, nextButton, deleteButton, showPictureButton)

        const reply = await interaction.reply({embeds: [embed], components: [row], ephemeral: true});
        const message = await reply.fetch();
        bookmarkMessages.set(message.id, new bookmarkGalarey(bookmarks, message, reply));
    }

    async nextBookmark(interaction: ButtonInteraction) {
        const data = bookmarkMessages.get(interaction.message.id);
        if(!data) return interaction.reply({content: "Es ist ein Fehler aufgetreten!", ephemeral: true});
        await data.next();
        await interaction.deferUpdate();
    }

    async previeousBookmark(interaction: ButtonInteraction) {
        const data = bookmarkMessages.get(interaction.message.id);
        if(!data) return interaction.reply({content: "Es ist ein Fehler aufgetreten!", ephemeral: true});
        await data.previeous();
        await interaction.deferUpdate();
    }

    async deleteBookmark(interaction: ButtonInteraction) {
        const data = bookmarkMessages.get(interaction.message.id);
        if(!data) return interaction.reply({content: "Es ist ein Fehler aufgetreten!", ephemeral: true});

        await data.delete();
        await interaction.deferUpdate();
    }
}

async function getPicture(channelID: string):Promise<LoNImage> {
    /**const collection = databaseManager.db.collection<LoNPicture>("LoN-pictures");
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
    }**/

    const response = await axios.get("https://yande.re/post.json?limit=100&page=" + (Math.floor(Math.random() * 100)))
    const data:LoNImage[] = response.data.filter((item: any) => (item.rating == "q" || item.rating == "e") && !item.has_children);
    const RNG = Math.floor(Math.random() * data.length);

    return data[RNG];
}

async function createLoNPicture(data:LoNImage) {
    const exeists = await databaseManager.db.loNImage.findUnique({where: {id: data.id}});
    if(exeists) return exeists;

    const create = await databaseManager.db.loNImage.create({data: {
        id: data.id,
        tags: data.tags,
        hasChildren: data.hasChildren,
        file_url: data.file_url,
        preview_url: data.preview_url,
        source: data.source,
        rating: data.rating
    }});
    

    return create;
}

async function sendNextPicture(channel:string){
    if(!CHANNELS.includes(channel)) return;
    const picture = await getPicture(channel);
    const image = createLoNPicture(picture);
    const lastPicture = await databaseManager.db.loNData.findFirst({where: {channelID: channel}, orderBy: {messageID: "desc"},include: {votes: true}});

    const discordChannel = await botManager.client.channels.fetch(channel)
    if(!discordChannel.isTextBased()) return;
    const message = await (<TextChannel> discordChannel).send(buildMessage(picture, 0, 0, 0))
    await databaseManager.db.loNData.create({data: {
        channelID: message.channelId,
        neededVotes: lastPicture? lastPicture.neededVotes : 3 ,
        pictureID: picture.id,
        messageID: message.id,
        deleted: false
    }})
}

function buildMessage(picture: LoNImage, save:number, lewd:number, nsfw:number, tags?: string){
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

        if(tags) embed.addFields([{name: "Tags", value: tags}]);
    
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

    const bookmarkButton = new ButtonBuilder()
        .setCustomId("lon-bookmark")
        .setLabel("Als Lesezeichen speichern")
        .setStyle(ButtonStyle.Primary)

    const showPictureButton = new ButtonBuilder()
        .setURL(picture.file_url)
        .setLabel("Show Picture")
        .setStyle(ButtonStyle.Link)

    const row:any = new ActionRowBuilder()
        .setComponents(saveButton, lewdButton, nsfwButton, ohShitButton)
    const row2:any = new ActionRowBuilder()
        .setComponents(bookmarkButton, showPictureButton)

    return {embeds: [embed], components: [row, row2]};
}

class bookmarkGalarey {

    private index = 0;
    
    constructor(private bookmarks: LoNBookmark[], private message: Message, private interactionRes: InteractionResponse) {}

    public async next() {
        this.index++;
        if(this.index == this.bookmarks.length) this.index = 0;
        return await this.editMessage();
    }

    public async previeous() {
        this.index--;
        if(this.index < 0) this.index = this.bookmarks.length - 1;
        return await this.editMessage();
    }

    public async delete() {
        const bookmark = this.bookmarks[this.index];
        await databaseManager.db.loNBookmark.delete({where: {id: bookmark.id}});
        this.bookmarks = this.bookmarks.filter((item) => item.id !== bookmark.id);
        if(this.bookmarks.length == 0) return await this.interactionRes.delete();
        return await this.editMessage();
    }

    private async editMessage() {
        await botManager.client.channels.fetch(this.message.channelId);
        const firstBookmark = this.bookmarks[this.index] as any;
        const embed = new EmbedBuilder();
        embed.setTitle("Lesezeichen " + (this.index + 1) + "/" + this.bookmarks.length);
        embed.setDescription(firstBookmark.picture.tags);
        embed.setImage(firstBookmark.picture.preview_url);
        embed.setColor("DarkAqua");

        const previeousButton = new ButtonBuilder()
        .setCustomId("lon-previeous")
        .setLabel("←")
        .setStyle(ButtonStyle.Primary)

        const nextButton = new ButtonBuilder()
        .setCustomId("lon-next")
        .setLabel("→")
        .setStyle(ButtonStyle.Primary)

        const deleteButton = new ButtonBuilder()
        .setCustomId("lon-delete-bookmark")
        .setLabel("Löschen")
        .setStyle(ButtonStyle.Danger)

        const showPictureButton = new ButtonBuilder()
        .setURL(firstBookmark.picture.file_url)
        .setLabel("Show Picture")
        .setStyle(ButtonStyle.Link)

        const row:any = new ActionRowBuilder()
        .setComponents(previeousButton, nextButton, deleteButton, showPictureButton)

        return await this.interactionRes.edit({embeds: [embed], components: [row]});
    }
}