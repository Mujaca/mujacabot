import { initialiseConsole } from './utils/console';
import botManager from './manager/botManager';
import commandManager from './manager/commandManager';
import moduleManager from './manager/moduleManager';
import { command } from "./classes/command";
import { APIInteraction } from 'discord.js';
import { WithIntrinsicProps } from '@discordjs/core';
import { connectDatabase } from './manager/databaseManager';
import { LewdOrNsFW } from './modules/LoN';

initialiseConsole();
connectDatabase();
botManager.connectBot();

//Register Modules
moduleManager.registerModule("LewdOrNsFW", new LewdOrNsFW());

//Register Commands outside of modules

// Submit Commands to Discord
commandManager.submitCommands();