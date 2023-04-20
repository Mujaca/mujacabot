export class command{
    
    private name: string;
    private description: string;
    public callBack: Function;
    
    constructor(name:string, description:string, callback:Function){
        this.name = name;
        this.description = description;
        this.callBack = callback;
    }

    public getDiscordCommand(){
        return {
            name: this.name,
            description: this.description
        }
    }
}