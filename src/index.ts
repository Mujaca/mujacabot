import { initialiseConsole } from './utils/console';
import botManager from './manager/botManager';
import commandManager from './manager/commandManager';
import moduleManager from './manager/moduleManager';
import { connectDatabase } from './manager/databaseManager';
import { LewdOrNsFW } from './modules/LoN';
import { profilePictures } from './modules/profilePictures';
import { TCG } from './modules/pokemon-tcg';
import { StarRail } from './modules/StarRail';

initialiseConsole();
connectDatabase();
botManager.connectBot();

//Register Modules
moduleManager.registerModule("LewdOrNsFW", new LewdOrNsFW());
moduleManager.registerModule("profilePictures", new profilePictures());
moduleManager.registerModule("TCG", new TCG());
//moduleManager.registerModule("StarRail", new StarRail());

//Register Commands outside of modules

// Submit Commands to Discord
commandManager.submitCommands();