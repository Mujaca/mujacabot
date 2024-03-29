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

export async function systemMessage(message:string) {
    broadcast("Gaia", message, "https://as1.ftcdn.net/v2/jpg/02/79/04/26/1000_F_279042657_Q222qQOH4BaKzzdTtCP8g5nj6G8AzbDG.jpg")
}

export default webhooks;