const {command} = require('../commands/command');
const commandmanagerclass = require('../commands/command_manager');
const {dcmodule} = require('./module')
const fetch = require("node-fetch");
class lewdornsfw extends dcmodule {
    constructor(){
        super();
        commandmanagerclass.registerCommand(new init())
    }
}
class init extends command {
    constructor(){
        super('lon', 'Lewd or NSFW Game', 'games', init)
        function init(args, message)  {
            getpic(message)
        }
        function getpic(message) {
            var api = "https://yande.re/post.json?limit=100"
            fetch(api + "&page=" + Math.floor(Math.random() * 100))
                .then(res => res.json())
                .then(json => {
                    var rng = Math.floor(Math.random() * 100);
                    var element = json[rng]                   
                    const filter = (reaction, user) => {
	                return ['838040937312944128', '838040595896860672'].includes(reaction.emoji.name) && user.id === message.author.id;
                    };
                    if (element.rating == "q" || element.rating == 'e'){
                        message.channel.send(element.jpeg_url).then(function(message){
                            message.react('✅')
                            message.react('838040937312944128')
                            message.react('838040595896860672') 
                            message.react('❌') 
                            
                            
                        })  
                    }
                    else {
                        getpic(message)
                    }
                })
                
        }

    }
}

exports.lon = lewdornsfw;
