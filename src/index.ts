import { initialiseConsole } from './utils/console';
import botManager from './manager/botManager';
import commandManager from './manager/commandManager';
import moduleManager from './manager/moduleManager';
// Module imports
import { connectDatabase } from './manager/dbManager';
import { LewdOrNsFW } from './modules/LoN';
import { profilePictures } from './modules/profilePictures';
import { TCG } from './modules/pokemon-tcg';
// Command imports
import { command } from './classes/command';
import { remindMe, remindMeDelete, remindMeJoin } from './commands/remindme';
import { interaction } from './classes/interaction';
import interactionManager from './manager/interactionManager';
import { PaP } from './modules/pen-and-paper';

initialiseConsole();
connectDatabase();
botManager.connectBot();

//Register Modules
moduleManager.registerModule("LewdOrNsFW", new LewdOrNsFW());
//moduleManager.registerModule("profilePictures", new profilePictures());
//moduleManager.registerModule("TCG", new TCG());
moduleManager.registerModule('PaP', new PaP());
//moduleManager.registerModule("StarRail", new StarRail());

//Register Commands outside of modules
/**const remindmeCommand = new command("remindme", "Erstellt eine Erinnerung", remindMe);
remindmeCommand.commandBuilder.addStringOption(option => option.setName("time").setDescription("Die Zeit, wann du erinnert werden möchtest").setRequired(true));
remindmeCommand.commandBuilder.addStringOption(option => option.setName("message").setDescription("Die Nachricht, die du erhalten möchtest").setRequired(true));
commandManager.registerCommand("remindme", remindmeCommand);**/

// Register Interactions outside of modules
/**interactionManager.registerInteraction('remindme-join', new interaction("remindme-join", remindMeJoin));
interactionManager.registerInteraction('remindme-delete', new interaction("remindme-delete", remindMeDelete));
**/
// Submit Commands to Discord
commandManager.submitCommands();