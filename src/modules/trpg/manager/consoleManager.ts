import { ChatInputCommandInteraction } from "discord.js";
import dbManager from "../../../manager/dbManager";

export async function handleInteraction(interaction: ChatInputCommandInteraction) {
    const command = interaction.options.getString('command');
    const args = interaction.options.getString('args');

    if(command == 'authCode' && (await checkAuthCode(args))) {
        await interaction.reply({content: "Super User permission granted. Please note, that super user permissions only lasts for 2 minutes, before you need another authCode. This mechanism is in place to prevent missuse of console.", ephemeral: true});
        await dbManager.db.rPGSuperUSer.create({
            data: {
                userID: interaction.user.id,
                expires_at: new Date(Date.now() + 1000 * 60 * 2)
            }
        })
        return;
    }

    const hasPermission = await dbManager.db.rPGSuperUSer.findFirst({
        where: {
            userID: interaction.user.id,
            expires_at: {
                gt: new Date()
            }
        }
    });
    if(!hasPermission) {
        await interaction.reply({content: "You do not have permission to use this command", ephemeral: true});
        return;
    }


}

export async function checkAuthCode(authCode:string) {
    const validCode = await dbManager.db.rPGauthCode.findFirst({
        where: {
            code: authCode,
            used: false
        }
    });

    if(validCode) await dbManager.db.rPGauthCode.update({
        where: {
            id: validCode.id
        },
        data: {
            used: true
        }
    });

    return validCode !== null;
}