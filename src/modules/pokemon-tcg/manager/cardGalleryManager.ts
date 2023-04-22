import { cardGallery } from "../classes/cardGallery";

const map:Map<string, cardGallery> = new Map();

function addGalery(cardGallery:cardGallery, messageID: string) {
    map.set(messageID, cardGallery);
}

function getGallery(messageID: string) {
    return map.get(messageID);
}

export default {
    addGalery,
    getGallery
}