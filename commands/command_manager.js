const commandclass = require('./command');

const commands = {};

function registerCommand(command){
    if(commands[command.prefix] == undefined){
        commands[command.prefix] = command;
    }else{
        console.error('Error regestering the command')
    }
}

function getCommand(prefix) {
    return commands[prefix]
}

function getCategorys(){
    var c = [];
    Object.keys(commands).forEach((key) => {
        const command = commands[key];
        if(!c.includes(command.category.toLowerCase())) c.push(command.category.toLowerCase())
    })

    return c;
}

function getAll(){
    return commands;
}

exports.registerCommand = registerCommand
exports.getCommand = getCommand
exports.getAll = getAll;
exports.getCategorys = getCategorys;