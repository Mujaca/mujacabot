import { ChatInputCommandInteraction, CommandInteraction } from "discord.js";
import dbManager from "../../../manager/dbManager";

export async function saveFeedback(interaction : ChatInputCommandInteraction) {
    const feedback = interaction.options.getString('feedback');
    if(!feedback) return interaction.reply({ content: 'Please provide feedback', ephemeral: true });

    await dbManager.db.rPGFeedback.create({
        data: {
            userID: interaction.user.id,
            message: feedback,
        }
    });
    interaction.reply({ content: 'Feedback saved', ephemeral: true });
}