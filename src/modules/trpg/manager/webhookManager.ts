import { EmbedBuilder, Webhook, WebhookClient } from "discord.js";

const webhooks:Map<string, Webhook | WebhookClient> = new Map();

export async function broadcast(username:string, message:string, profilePicture:string = "https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg") {
    for(let webhook of webhooks.values()) {
        try {
            await webhook.send({
                username: username,
                content: message,
                avatarURL: profilePicture,
            });
        } catch (error) {
            continue;
        }
    }

    return true;
}

export default webhooks;