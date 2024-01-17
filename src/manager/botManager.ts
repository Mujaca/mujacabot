import { GatewayDispatchEvents, GatewayIntentBits, InteractionType, MessageFlags, Client } from 'discord.js';
import { REST } from '@discordjs/rest';
import * as dotenv from "dotenv";
dotenv.config();

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

const client = new Client({
    intents: [GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.Guilds ,GatewayIntentBits.GuildMessageReactions]
});

function connectBot() {
    client.login(process.env.TOKEN);
    client.once('ready', () => {
        console.log('Client ready!');
    });
}

export default {
    client,
    rest,
    connectBot
}