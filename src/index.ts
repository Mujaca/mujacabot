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
commandManager.registerCommand("ping", new command("ping", "Ping Command", (interaction: WithIntrinsicProps<APIInteraction>) => {interaction.api.interactions.reply(interaction.data.id, interaction.data.token, {content: "This is a Test Command to see if the Bot is still up!" })}));