//Manager Classes
const commandmanager = require('../commands/command_manager');
const { help } = require('../commands/help');

commandmanager.registerCommand(new help())
//Discord JS
const Discord = require('discord.js');
const config = require('../config.json');
const client = new Discord.Client();

client.on('ready', () => {
    console.log(`Bot started as ${client.user.tag}!`);
});

client.on('message', (message) => {
    const prefix = message.content.slice(0, 1);
    const args = message.content.substring(1).split(" ");
    const command_prefix = args.splice(0, 1);
    if(prefix.toLocaleLowerCase() == config.discord.prefix.toLocaleLowerCase()) {
        try {
            var command = commandmanager.getCommand(command_prefix);
            if(command) command.run(args, message)
        } catch (error) {
            console.error(error);
            const embed = new Discord.MessageEmbed()
            .setColor('#FF0000')
            .setTitle('An Error Occured')
            .setDescription('Please contact Mujaca#2202')
            .setAuthor('MujacaBot', "https://cdn.discordapp.com/avatars/347650737741758465/2f11adb08225b0f9195d93541bcb33da.png?size=256")
            .setTimestamp()
            message.channel.send(embed)
        }
    }
})

client.login(config.discord.token);
exports.client = client;