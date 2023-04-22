import { Card } from "pokemon-tcg-sdk-typescript/dist/sdk";
import { deck, inventoryItem, playerData } from "../../../@types/tcg";
import databaseManager from "../../../manager/databaseManager";

export class player{
    private userID: string;
    private money: number = 0;;
    private cards: Card[] = [];
    private decks: deck[] = [];
    private inventory: inventoryItem[] = [];

    constructor(userID: string) {
        this.userID = userID;
        this.onConstruct();
    }

    private async onConstruct() {
        const player = await this.findUser();
        this.money = player.money;
        this.cards = player.cards;
        this.decks = player.decks;
        this.inventory = player.inventory;
    }

    private async findUser() {
        const playerCollection = databaseManager.db.collection<playerData>("TCGplayer");
        const player = await playerCollection.findOne({userID: this.userID});
        if(player) return player;

        const obj: playerData = {
            userID: this.userID,
            money: this.money,
            cards: this.cards,
            decks: this.decks,
            inventory: this.inventory
        }
        playerCollection.insertOne(obj);
        return obj;
    }

    private async update() {
        const playerCollection = databaseManager.db.collection<playerData>("TCGplayer");
        await playerCollection.updateOne({userID: this.userID}, {$set: {
            money: this.money,
            cards: this.cards,
            decks: this.decks,
            inventory: this.inventory
        }});
    }

    public getMoney() {
        return this.money;
    }

    public addMoney(amount: number) {
        this.money += amount;
        this.update();
    }

    public removeMoney(amount: number) {
        this.money -= amount;
        this.update();
    }

    public getCards() {
        return this.cards;
    }

    public addCard(card: Card) {
        this.cards.push(card);
        this.update();
    }

    public removeCard(card: Card) {
        this.cards = this.cards.filter(c => c.id !== card.id);
        this.update();
    }

    public getDecks() {
        return this.decks;
    }

    public addDeck(deck: deck) {
        this.decks.push(deck);
        this.update();
    }

    public removeDeck(deck: deck) {
        this.decks = this.decks.filter(d => d.name !== deck.name);
        this.update();
    }

    public getInventory() {
        return this.inventory;
    }

    public addInventoryItem(item: string) {
        if(this.inventory.find(i => i.name === item)) {
            this.inventory.find(i => i.name === item).amount += 1;
            this.update();
            return;
        }
        this.inventory.push({name: item, amount: 1});
        this.update();
    }

    public removeInventoryItem(item: string) {
        if(this.inventory.find(i => i.name === item).amount > 1) {
            this.inventory.find(i => i.name === item).amount -= 1;
            this.update();
            return;
        }
        this.inventory = this.inventory.filter(i => i.name !== item);
        this.update();
    }
}