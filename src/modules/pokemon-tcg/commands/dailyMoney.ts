import { ChatInputCommandInteraction } from "discord.js";
import playerDataManager from "../manager/playerDataManager";
import databaseManager from "../../../manager/databaseManager";

export async function TCGdailyMoney(interaction: ChatInputCommandInteraction) {
    const collection = databaseManager.db.collection("TCGplayer-dailyMoneyCooldown");
    const cooldown = await collection.findOne({userID: interaction.user.id});
    if(cooldown) {
        const time = cooldown.time;
        const now = Date.now();
        const diff = now - time;
        const hours = Math.floor(diff / 1000 / 60 / 60);
        if(hours < 24) return interaction.reply({content: `Du kannst diesen Befehl erst in ${(24 - hours) - 1} Stunden wieder benutzen!`, ephemeral: true});
        
    }

    collection.updateOne({userID: interaction.user.id}, {$set: {time: Date.now()}}, {upsert: true});
    const player = playerDataManager.getPlayer(interaction.user.id);
    player.addMoney(100);
    await interaction.reply({content: `Du hast 100$ erhalten!`, ephemeral: true});
}