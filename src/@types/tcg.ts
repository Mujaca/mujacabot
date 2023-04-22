import { Card } from "pokemon-tcg-sdk-typescript/dist/sdk";

export interface playerData {
    userID: string;
    money: number;
    cards: Card[];
    decks: deck[];
    inventory: inventoryItem[];
}

export interface deck {
    name: string;
    cards: Card[];
}

export interface inventoryItem {
    name: string;
    amount: number;
}