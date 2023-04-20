import { SlashCommandBuilder } from "discord.js";

export class command{
    
    public callBack: Function;
    public commandBuilder: SlashCommandBuilder = new SlashCommandBuilder();
    
    constructor(name:string, description:string, callback:Function){
        this.callBack = callback;

        this.commandBuilder.setName(name.toLocaleLowerCase());
        this.commandBuilder.setDescription(description);
    }

    public getDiscordCommand(){
        return this.commandBuilder;
    }
}