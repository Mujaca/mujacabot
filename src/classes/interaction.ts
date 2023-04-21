export class interaction{
    
    private name: string;
    public callBack: Function;
    
    constructor(name:string, callback:Function){
        this.name = name;
        this.callBack = callback;
    }
}