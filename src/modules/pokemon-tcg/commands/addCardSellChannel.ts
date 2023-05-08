import { ChatInputCommandInteraction, TextChannel } from "discord.js";
import botManager from "../../../manager/botManager";
import databaseManager from "../../../manager/databaseManager";

export async function TCGAddPackSellChannel(interaction: ChatInputCommandInteraction) {
    const channelID = interaction.options.getChannel("channel").id;
    if(!channelID) return interaction.reply({content: "Du musst einen Channel angeben!", ephemeral: true});

    const channel:TextChannel = <TextChannel> await botManager.client.channels.fetch(channelID);
    if(!channel.isTextBased()) return interaction.reply({content: "Der Channel muss ein Textchannel sein!", ephemeral: true});

    const collection = databaseManager.db.collection("TCGPackSellChannel");
    if(collection.findOne({channelID: channelID})) {
        const messageCollection = databaseManager.db.collection("TCGPackSellMessage");
        const messages = await messageCollection.find({channelID: channelID}).toArray();

        for(const message of messages) {
            const channel = await botManager.client.channels.fetch(message.channelID);
            if(channel.isTextBased()) {
                const discordMessage = await channel.messages.fetch(message.messageID);
                await discordMessage.delete();
            }
        }

        await collection.deleteOne({channelID: channelID});
        await messageCollection.deleteMany({channelID: channelID});
        return interaction.reply({content: "Der Channel wurde erfolgreich entfernt!", ephemeral: true});
    }

    

}