//Module import
const { lon } = require('./modules/lewdornsfw');
const { playlist } = require('./modules/playlist/playlist');

//Startup
//require('./startup/console');
require('./startup/error');
require('./startup/config');
require('./startup/discord')

//Module initialize
new lon();
new playlist();