const fs = require('fs');

fs.readFile('./config.json', (err, data) => {
    if(err) {
        console.log('Error reading config File.')
        fs.copyFile('./config.example.json', 'config.json', (err) => {})
        process.exit(1);
    }else{
        console.log('Config loaded')
    }
}) 