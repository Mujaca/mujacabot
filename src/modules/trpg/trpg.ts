import { Module } from "../../classes/module";
import botManager from "../../manager/botManager";


export class TRPG extends Module {
    constructor() {
        super("trpg");
        console.log("AAAAA")
        botManager.client.on("messageCreate", (message) => {
            console.log(message.channelId)
        });
        
    }
}