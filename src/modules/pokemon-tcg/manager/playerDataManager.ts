import { player } from "../classes/player";

const players:Map<string, player> = new Map();

function getPlayer(userID: string):player {
    let p = players.get(userID);
    if(!p) {
        p = new player(userID);
        players.set(userID, p);
    }

    return p;
}

export default {
    getPlayer
}