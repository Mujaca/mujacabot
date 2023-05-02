import { ChatInputCommandInteraction, InteractionResponse } from "discord.js";
import databaseManager from "../../../manager/databaseManager";
import axios from "axios";
import botManager from "../../../manager/botManager";

export async function auth(interaction: ChatInputCommandInteraction) {
    const authkey = interaction.options.getString("authkey");
    const reply = await interaction.deferReply();
    const authkeyCheck = await axios.get(`https://api-os-takumi.mihoyo.com/common/gacha_record/api/getGachaLog?authkey_ver=1&sign_type=2&auth_appid=webview_gacha&win_mode=fullscreen&gacha_id=dbebc8d9fbb0d4ffa067423482ce505bc5ea&timestamp=${Math.floor(new Date().getTime() / 1000)}&region=prod_official_usa&default_gacha_type=11&lang=de&authkey=${authkey}&game_biz=hkrpg_global&9&plat_type=pc&page=1&size=5&gacha_type=1&end_id=0`)

    if (authkeyCheck.data.retcode != 0) {
        replyToDefer(reply, interaction, "Dein AuthKey ist ungültig!", 5000);
        return;
    }

    databaseManager.db.collection('starrail-auth').deleteMany({ userID: interaction.user.id });
    databaseManager.db.collection('starrail-auth').insertOne({
        userID: interaction.user.id,
        authkey: authkey
    })

    replyToDefer(reply, interaction, "Dein AuthKey wurde erfolgreich gespeichert!", 5000);
}

async function replyToDefer(reply: InteractionResponse, interaction: ChatInputCommandInteraction, message: string, deleteTimer: number) {
    reply.delete();
    const channel = await botManager.client.channels.fetch(interaction.channelId);
    if (channel.isTextBased()) {
        const discordMessage = await channel.send({ content: message });
        setTimeout(async () => {
            await discordMessage.delete();
        }, deleteTimer);
    }
}