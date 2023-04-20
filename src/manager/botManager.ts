import { GatewayDispatchEvents, GatewayIntentBits, InteractionType, MessageFlags, Client } from '@discordjs/core';
import { REST } from '@discordjs/rest';
import { WebSocketManager } from '@discordjs/ws';
import * as dotenv from "dotenv";
dotenv.config();

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
const ws = new WebSocketManager({
    intents: GatewayIntentBits.GuildMessages | GatewayIntentBits.GuildMessageReactions,
    token: process.env.TOKEN,
    rest
})

const client = new Client({ rest, ws });

function connectBot() {
    client.once(GatewayDispatchEvents.Ready, () => {
        console.log('Client ready!');
    });
    ws.connect();
}

export default {
    client,
    rest,
    ws,
    connectBot
}