import * as colors from 'colors';
colors.enable();
export function initialiseConsole(){
    let log = console.log;
    let error = console.error;
    let debug = console.debug;
    
    console.log = function () {
        let first_parameter = arguments[0];
        let other_parameters = Array.prototype.slice.call(arguments, 1);
        log.apply(console, [formatConsoleDate(new Date(), "CORE").green + first_parameter].concat(other_parameters));
    };
    
    console.debug = function () {
        let first_parameter = arguments[0];
        let other_parameters = Array.prototype.slice.call(arguments, 1);
    
        let string = [first_parameter].concat(other_parameters) + ' ';
        debug.apply(console, [formatConsoleDate(new Date(), "MODULE MANAGER").yellow + string]);
    };
    
    console.error = function () {
            let first_parameter = arguments[0];
            let other_parameters = Array.prototype.slice.call(arguments, 1);
    
            let string = [first_parameter].concat(other_parameters) + ' ';
    
            error.apply(console, [formatConsoleDate(new Date(), "COMMAND MANAGER").red + string]);
    };    

    console.info = function () {
        let first_parameter = arguments[0];
        let other_parameters = Array.prototype.slice.call(arguments, 1);
        log.apply(console, [formatConsoleDate(new Date(), "INTERACTION MANAGER").green + first_parameter].concat(other_parameters));
    }
}

function formatConsoleDate (date: Date, type: string) {
    let hour = date.getHours();
    let minutes = date.getMinutes();
    let seconds = date.getSeconds();

    return '[' + type + ' ' +
           ((hour < 10) ? '0' + hour: hour) +
           ':' +
           ((minutes < 10) ? '0' + minutes: minutes) +
           ':' +
           ((seconds < 10) ? '0' + seconds: seconds) +
           '] ';
}