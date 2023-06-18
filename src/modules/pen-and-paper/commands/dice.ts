import { ChatInputCommandInteraction } from "discord.js";

const numberToEmote = {
    "0": "0️⃣",
    "1": "1️⃣",
    "2": "2️⃣",
    "3": "3️⃣",
    "4": "4️⃣",
    "5": "5️⃣",
    "6": "6️⃣",
    "7": "7️⃣",
    "8": "8️⃣",
    "9": "9️⃣"
}

export async function PaProllDice(interaction: ChatInputCommandInteraction) {
    const silent = interaction.options.getBoolean("silent") ?? false;
    const dice = interaction.options.getInteger("dice") ?? 10;

    const result = Math.floor(Math.random() * dice);

    const interactionMessage = interaction.reply({content:`Rolling ...`, ephemeral:silent});
    for(let i = 0; i < 5; i++) {
        const tensionRoll = Math.floor(Math.random() * dice);
        (await interactionMessage).edit({content:`${convertToEmote(tensionRoll)}`})
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    let message;
    switch(result) {
        case 0:
            message = "Kritischer Erfolg!";
            break;
        case 1:
            message = "Kritischer Misserfolg!";
            break;
    }
    
    (await interactionMessage).edit({content:`:sparkles:${convertToEmote(result)}:sparkles: ${message ?? ""}`})
}

function convertToEmote(number: number) {
    const numberString = number.toString();
    let result = "";
    for(let i = 0; i < numberString.length; i++) {
        result += numberToEmote[numberString[i] as keyof typeof numberToEmote];
    }
    return result;
}