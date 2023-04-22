import { ButtonInteraction, ChatInputCommandInteraction } from "discord.js";
import { PokemonTCG } from 'pokemon-tcg-sdk-typescript'
import cardGalleryManager from "../manager/cardGalleryManager";
import { cardGallery } from "../classes/cardGallery";
import botManager from "../../../manager/botManager";

export async function TCGviewSet(interaction: ChatInputCommandInteraction) {
    const setName = interaction.options.getString("set");
    if(!setName) return interaction.reply({content: "Du musst ein Set angeben!", ephemeral: true});
    const set = await PokemonTCG.findSetsByQueries({q: `name:${setName}`});
    if(!set || set.length == 0) return interaction.reply({content: "Dieses Set gibt es nicht!", ephemeral: true});
    const deferReply = await interaction.deferReply();
    const cards = await PokemonTCG.findCardsByQueries({q: `set.id:${set[0].id}`});
    

    const gallery = new cardGallery(cards);
    const embed = await gallery.getEmbed(0);
    const channel = await botManager.client.channels.fetch(interaction.channelId);
    await deferReply.delete()
    if(channel.isTextBased()) {
        const message = await channel.send({embeds: embed.embeds, components: embed.components});
        cardGalleryManager.addGalery(gallery, message.id);
    }
}

export async function TCGviewSetNext(interaction: ButtonInteraction) {
    const gallery = cardGalleryManager.getGallery(interaction.message.id);
    if(!gallery) return interaction.reply({content: "Diese Karte existiert nicht mehr!", ephemeral: true});
    const embed = await gallery.getNextCard();
    await interaction.message.edit({embeds: embed.embeds, components: embed.components});
    await interaction.deferUpdate();
}

export async function TCGviewSetLast(interaction: ButtonInteraction) {
    const gallery = cardGalleryManager.getGallery(interaction.message.id);
    if(!gallery) return interaction.reply({content: "Diese Karte existiert nicht mehr!", ephemeral: true});
    const embed = await gallery.getLastCard();
    await interaction.message.edit({embeds: embed.embeds, components: embed.components});
    await interaction.deferUpdate();
}