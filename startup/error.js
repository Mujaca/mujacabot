process.stdin.resume();//so the program will not close instantly


//do something when app is closing
process.on('exit', () => {
    console.debug("Programm closed")
});

//catches ctrl+c event
process.on('SIGINT', () => {
    console.log("Programm was shutdown by User")
    setTimeout(() => {
        process.exit(1);
    }, 500);
});

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', () => {
    console.debug("Programm was forceshutdowned")
    process.exit(1);
});
process.on('SIGUSR2', () => {
    console.debug("Programm was forceshutdowned")
    process.exit(1);
});

//catches uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error(error.stack)
});

console.log("Errorhandling loaded!")