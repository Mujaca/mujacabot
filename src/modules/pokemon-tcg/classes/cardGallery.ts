import { Card } from "pokemon-tcg-sdk-typescript/dist/sdk";
import playerDataManager from "../manager/playerDataManager";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";

export class cardGallery {

    private cards:Card[];
    private lastCardIndex:number = 0;

    constructor(cards:Card[]) {
        this.cards = cards;
    }

    public async getEmbed(cardIndex: number) {
        this.lastCardIndex = cardIndex;

        const embed = new EmbedBuilder();
        embed.setTitle(this.cards[cardIndex].name);
        embed.setImage(this.cards[cardIndex].images.large);
        embed.setFooter({text: `Karte ${cardIndex + 1} von ${this.cards.length}`});

        const last = new ButtonBuilder();
        last.setLabel("Letzte Karte");
        last.setStyle(ButtonStyle.Primary);
        last.setCustomId("lastTCGCard");

        const next = new ButtonBuilder();
        next.setLabel("Nächste Karte");
        next.setStyle(ButtonStyle.Primary);
        next.setCustomId("nextTCGCard");

        const row:any = new ActionRowBuilder().addComponents(last, next);
        return {embeds: [embed], components: [row]};
    }

    public async getLastCard() {
        if(this.lastCardIndex == 0) this.lastCardIndex = this.cards.length;
        return this.getEmbed(this.lastCardIndex - 1);
    }

    public async getNextCard() {
        if(this.lastCardIndex + 1 == this.cards.length) this.lastCardIndex = -1;
        return this.getEmbed(this.lastCardIndex + 1);
    }
}