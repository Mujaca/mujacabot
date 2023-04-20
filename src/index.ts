import { initialiseConsole } from './utils/console';
import botManager from './manager/botManager';
import commandManager from './manager/commandManager';
import { command } from "./classes/command";
import { APIInteraction } from 'discord.js';
import { WithIntrinsicProps } from '@discordjs/core';
import { connectDatabase } from './manager/databaseManager';

initialiseConsole();
connectDatabase();

botManager.connectBot();
commandManager.registerCommand("ping", new command("ping", "Ping Command", (interaction: WithIntrinsicProps<APIInteraction>) => {interaction.api.interactions.reply(interaction.data.id, interaction.data.token, {content: "Pong!"})}));