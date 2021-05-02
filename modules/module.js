const { client } = require('../startup/discord')

class dcmodule{
    constructor(){
        this.client = client;
    }
}

exports.dcmodule = dcmodule;