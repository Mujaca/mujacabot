const { command } = require("./command");
const command_manager = require('./command_manager');
const Discord = require('discord.js');
const config = require('../config.json');

class help extends command{
    constructor(){
        super('help', 'Die Befehle in der Übersicht', 'Essential' , (args, mesage) => {
            var commands = command_manager.getAll();
            var categorys = command_manager.getCategorys();

            const message = new Discord.MessageEmbed()
            .setColor('#0099ff')
	        .setTitle('Liste aller Verfügbaren Befehlen')
            .setAuthor('MujacaBot', "https://cdn.discordapp.com/avatars/347650737741758465/2f11adb08225b0f9195d93541bcb33da.png?size=256")
            .setTimestamp()

            categorys.forEach((category, index) => {
                var c = []
                Object.keys(commands).forEach((key) => {
                    const command = commands[key]
                    if(command.category.toLowerCase() == category.toLowerCase()) {
                        c.push(`${config.discord.prefix}${command.prefix}    -   ${command.description}`)
                    }
                })
                message.addField(category.charAt(0).toUpperCase() + category.slice(1), c, true)
            })

            mesage.channel.send(message)
        });
    }
}

exports.help = help;