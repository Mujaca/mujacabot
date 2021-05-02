const fs = require("fs");

var errors = 0;

var log = console.log;
var error = console.error;
var debug = console.debug;

if(!fs.existsSync('./logs/')) fs.mkdirSync('./logs/')
if(fs.existsSync('./logs/latest.log')) fs.unlinkSync('./logs/latest.log')

console.log = async function () {
    var first_parameter = arguments[0];
    var other_parameters = Array.prototype.slice.call(arguments, 1);
    fs.appendFileSync('./logs/latest.log', [formatConsoleDate(new Date(), "INFO") + first_parameter].concat(other_parameters) + "\n");
    log.apply(console, [formatConsoleDate(new Date(), "INFO") + first_parameter].concat(other_parameters));

    errors = 0;
};

console.debug = function () {
    var first_parameter = arguments[0];
    var other_parameters = Array.prototype.slice.call(arguments, 1);
    fs.appendFileSync('./logs/latest.log', [formatConsoleDate(new Date(), "DEBUG") + first_parameter].concat(other_parameters) + "\n");

    errors = 0;
};

console.error = function () {
    errors++;
    if(errors < 20){
        var first_parameter = arguments[0];
        var other_parameters = Array.prototype.slice.call(arguments, 1);
        fs.appendFileSync('./logs/latest.log', [formatConsoleDate(new Date(), "ERROR") + first_parameter].concat(other_parameters) + "\n");
        log.apply(console, [formatConsoleDate(new Date(), "ERROR") + first_parameter].concat(other_parameters));
    }
};

console.log("Initialized Log File")

function formatConsoleDate (date, type) {
    var hour = date.getHours();
    var minutes = date.getMinutes();
    var seconds = date.getSeconds();
    var milliseconds = date.getMilliseconds();

    return '[' + type + ' ' +
           ((hour < 10) ? '0' + hour: hour) +
           ':' +
           ((minutes < 10) ? '0' + minutes: minutes) +
           ':' +
           ((seconds < 10) ? '0' + seconds: seconds) +
           '] ';
}