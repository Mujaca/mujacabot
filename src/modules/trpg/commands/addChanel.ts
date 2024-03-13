import { ChatInputCommandInteraction, EmbedBuilder, TextChannel } from "discord.js";
import botManager from "../../../manager/botManager";
import dbManager from "../../../manager/dbManager";
import webhooks from "../manager/webhookManager";

export async function addttrpgchannel(interaction: ChatInputCommandInteraction) {
    const channelID = interaction.options.getChannel("channel").id;
;

    const dbChannel = await dbManager.db.rPGChannel.findUnique({
        where: {
            channelID
        }
    })

    if(dbChannel) {
        return await interaction.reply({
            content: "Please contact @mujaca to remove this channel from the TTRPG Channels",
            ephemeral: true
        })
    }

    const channel = await botManager.client.channels.fetch(channelID)
    if(!channel.isTextBased) return;
    const textChannel = channel as TextChannel;
    const webhook = await textChannel.createWebhook({
        name: "TRPG"
    }) 

    await dbManager.db.rPGChannel.create({
        data: {
            channelID,
            webhookId: webhook.id,
            webhookToken: webhook.token
        }
    })


    webhooks.set(channelID, webhook);

    await interaction.reply({
        content: "This Channel was added as a TTRPG Channel!",
        ephemeral: true
    })

    const embed = new EmbedBuilder();
    embed.setTitle("Thanks for using Gaia!")
    embed.setDescription("In the following you will find all interesting things you will need to use Gaia.")
    embed.setFields([
        {name: "/trpg create Character [name]", value: "Use this to get your very own Character!", inline: true},
        {name: "/trpg create Item [name] [description] [damage]", value: "Use this to create a custom Item!", inline: true},
        {name: "/trpg create City [name] [description]", value: "Use this to custom Items!", inline: true},
        {name: "/trpg create NPC [name] [description] [city]", value: "Use this to custom Items!", inline: true},
        {name: "Talk to NPCs", value: "If you want to talk to an NPC use @[NPC Name] and then your message!"},
        {name: "Roleplay", value: "Please have fun roleplaying with the others!", inline: true},
    ])
    embed.setColor("LuminousVividPink")
    embed.setFooter({
        text: "vWZm kVnn Vpa! IdXco VggZn dno nj rdZ Zn nXcZdio.; 5"
    })

    const webhookMessage = await webhook.send({
        username: "Gaia",
        avatarURL: "https://as1.ftcdn.net/v2/jpg/02/79/04/26/1000_F_279042657_Q222qQOH4BaKzzdTtCP8g5nj6G8AzbDG.jpg",
        embeds: [embed]
    })
    await webhookMessage.pin();
}