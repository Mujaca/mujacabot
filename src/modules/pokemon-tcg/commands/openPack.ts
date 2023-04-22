import { ChatInputCommandInteraction } from "discord.js";
import { PokemonTCG } from "pokemon-tcg-sdk-typescript";
import { Card } from "pokemon-tcg-sdk-typescript/dist/sdk";
import { cardGallery } from "../classes/cardGallery";
import cardGalleryManager from "../manager/cardGalleryManager";
import botManager from "../../../manager/botManager";
import playerDataManager from "../manager/playerDataManager";


export async function TCGopenPack(interaction: ChatInputCommandInteraction) {
    const setName = interaction.options.getString("set");
    if(!setName) return interaction.reply({content: "Du musst ein Set angeben!", ephemeral: true});
    const set = await PokemonTCG.findSetsByQueries({q: `name:${setName}`});
    if(!set || set.length == 0) return interaction.reply({content: "Dieses Set gibt es nicht!", ephemeral: true});

    const player = playerDataManager.getPlayer(interaction.user.id);
    const pack = player.getInventory().find(item => item.name == setName + " Pack");
    if(!pack || pack.amount <= 0) return interaction.reply({content: "Du hast kein Pack dieses Sets", ephemeral: true});

    const deferReply = await interaction.deferReply();
    const cards = await PokemonTCG.findCardsByQueries({q: `set.id:${set[0].id}`});
    const rarities:Rarity[] = [];
    for(const card of cards) if(!rarities.includes(card.rarity as Rarity) && card.rarity != null) rarities.push(card.rarity as Rarity);

    const drawn:Card[] = [];
    for (let index = 0; index < 10; index++) {
        const rarity = rollRarity(rarities);
        if(!rarity) {
            const channel = await botManager.client.channels.fetch(interaction.channelId);
            await deferReply.delete()
            if(channel.isTextBased()) {
                await channel.send({content: "Es ist ein Fehler beim öffnen des Packs aufgetreten!"});
            }
            return;
        }
        const card = cards.filter(card => card.rarity == rarity)[Math.floor(Math.random() * cards.filter(card => card.rarity == rarity).length)];
        drawn.push(card);
    }
    

    const gallery = new cardGallery(drawn);
    const embed = await gallery.getEmbed(0);
    const channel = await botManager.client.channels.fetch(interaction.channelId);
    await deferReply.delete()
    if(channel.isTextBased()) {
        const message = await channel.send({embeds: embed.embeds, components: embed.components});
        cardGalleryManager.addGalery(gallery, message.id);
    }

    player.removeInventoryItem(setName + " Pack");
    for(const card of drawn) {
        player.addCard(card);
    }
}

function rollRarity(rarities: Rarity[]): Rarity | null {
  let totalChance = rarities.reduce((acc, rarity) => acc + (CHANCEN[rarity] ?? 0), 0);
  let random = Math.random() * 100;
  let sum = 0;
  for (let rarity of rarities) {
    let chance = CHANCEN[rarity] ?? 0;
    sum += chance;
    if (random <= sum / totalChance * 100) {
      return rarity;
    }
  }
  return null;
}
  
type Rarity = keyof typeof CHANCEN;
const CHANCEN = {
    "Common": 40,
    "Uncommon": 10,
    "Promo": 5,
    "Rare": 5,
    "Rare ACE": 2.5,
    "Rare BREAK": 2.5,
    "Rare Prime": 2.5,
    "Rare Prism Star": 2.5,
    "Rare Rainbow": 2.5,
    "Rare Ultra": 2.5,
    "Rare Holo": 2.2,
    "Rare Holo EX": 2.2,
    "Rare Holo GX": 2.2,
    "Rare Holo Lv.X": 2.1,
    "Rare Holo Star": 2.1,
    "Rare Holo V": 2.1,
    "Rare Holo VMAX": 2.1,
    "Rare Shiny": 2.05,
    "Rare Shiny GX": 2.05,
    "Rare Shining": 2.05,
    "Rare Secret": 2.05,
    "Amazing Rare": 1.0,
    "LEGEND": 0.8
}