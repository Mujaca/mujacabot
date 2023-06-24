import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder, TextChannel } from "discord.js";
import { getZonedTime, findTimeZone, getUnixTime } from "timezone-support";
import databaseManager from "../manager/databaseManager";
import botManager from "../manager/botManager";


//const letterRegEx = /^[A-Za-z]+$/;
//const numberRegEx = /^[0-9]+$/;

const shortTime = {
    "s": 1000,
    "m": 60000,
    "h": 3600000,
    "d": 86400000,
    "w": 604800000,
    "y": 31536000000
}
const timezone = findTimeZone("Europe/Berlin");


export async function remindMe(interaction: ChatInputCommandInteraction) {
    const time = interaction.options.getString("time").toLowerCase();
    const message = interaction.options.getString("message");
    const finalDate = new Date(getUnixTime(getZonedTime(new Date(), timezone)));
    console.log(getUnixTime(getZonedTime(new Date(), timezone)));

    if (time.includes('.')) {
        const index = time.split(' ').findIndex((value) => value.includes('.'));

        const date = time.split(' ')[index];
        if (date.split('.').length != 3) return interaction.reply({ephemeral:true,content:"Bitte gib ein gültiges Datum an! (TT.MM.JJJJ)"});

        const day = date.split('.')[0];
        const month = date.split('.')[1];
        const year = date.split('.')[2];

        finalDate.setFullYear(parseInt(year));
        finalDate.setMonth(parseInt(month) - 1);
        finalDate.setDate(parseInt(day));
    }

    if (time.includes(':')) {
        const index = time.split(' ').findIndex((value) => value.includes(':'));
        const date = time.split(' ')[index];
        const timesplit = date.split(':');

        const hour = timesplit[0];
        const minute = timesplit[1];
        const seconds = timesplit[2];
        const miliseconds = timesplit[3];

        finalDate.setHours(parseInt(hour));
        finalDate.setMinutes(parseInt(minute));
        if (seconds) finalDate.setSeconds(parseInt(seconds));
        if (miliseconds) finalDate.setMilliseconds(parseInt(miliseconds));
    }

    const hasShortTime = Object.keys(shortTime).some((value) => time.includes(value));
    if (hasShortTime) {
        const letters = time.split('').filter((value) => value.match(/^[A-Za-z]+$/));
        if (letters.length > 1) return interaction.reply({ephemeral:true,content:"Bitte gib nur eine Zeitangabe an!"});
        const letterIndex = time.split('').findIndex((value) => value.match(/^[A-Za-z]+$/));

        // Get the number from last space to letter
        const number = time.lastIndexOf(' ') + 1 > letterIndex ? time.substring(0, letterIndex) : time.substring(time.lastIndexOf(' ') + 1, letterIndex);
        if (!number) return interaction.reply({ephemeral:true,content:"Bitte gib eine Zeitangabe an!"});
        if (!number.match(/^[0-9]+$/)) return interaction.reply({ephemeral:true,content:"Bitte gib eine gültige Zeitangabe an!"});

        const letter = letters[0];
        if (!letter) return interaction.reply({ephemeral:true,content:"Bitte gib eine Zeitangabe an!"});

        const timeInMiliseconds = parseInt(number) * shortTime[letter as keyof typeof shortTime];
        finalDate.setTime(finalDate.getTime() + timeInMiliseconds);
    }

    const currentDate = new Date(getUnixTime(getZonedTime(new Date(), timezone)));
    console.log(currentDate.getTime());
    if (finalDate.getTime() < currentDate.getTime()) return interaction.reply({ephemeral:true,content:"Bitte gib eine Zeit in der Zukunft an!"});

    const user = interaction.user;
    const channelId = interaction.channelId;
    const embed = new EmbedBuilder();
    embed.setTitle("Neue Erinnerung am");
    embed.setDescription(`${finalDate.toLocaleString("de-DE")}\n\n"${message}"`);

    const saveButton = new ButtonBuilder()
        .setCustomId("remindme-join")
        .setLabel("Ich will auch!")
        .setStyle(ButtonStyle.Success)

    const deleteButton = new ButtonBuilder()
        .setCustomId("remindme-delete")
        .setLabel("Ich will nicht mehr!")
        .setStyle(ButtonStyle.Danger)

    const row: any = new ActionRowBuilder()
        .addComponents(saveButton, deleteButton);

    await interaction.reply({content: "Erinnerung erstellt!", ephemeral: true});
    const messageEmbed = await (await interaction.guild?.channels.fetch(channelId) as TextChannel).send({
        embeds: [embed],
        components: [row]
    });

    const messageId = messageEmbed.id;
    const collection = databaseManager.db.collection("remindme");
    await collection.insertOne({
        messageId: messageId,
        channelId: channelId,
        users: [user.id],
        date: finalDate.getTime(),
        message: message
    });

    setTimeout(async () => {
        const channel = await interaction.guild?.channels.fetch(channelId);
        if(!channel.isTextBased()) return;
        const collection = databaseManager.db.collection("remindme");
        const users = await collection.findOne({ messageId: messageId }).then((value) => value?.users);
        if (!users) return;

        const embed = new EmbedBuilder();
        embed.setTitle("Erinnerung");
        embed.setDescription(`${message}`);

        await channel?.send({content: `<@${users.join('>, <@')}>`, embeds: [embed]});
        await collection.deleteOne({ messageId: messageId });
    }, finalDate.getTime() - currentDate.getTime());
}

export async function remindMeJoin(interaction: ButtonInteraction) {
    const collection = databaseManager.db.collection("remindme");
    const reminder = await collection.findOne({ messageId: interaction.message.id });
    if (!reminder) return interaction.reply({content: "Diese Erinnerung existiert nicht mehr!", ephemeral: true});

    const users = reminder.users;
    if (users.includes(interaction.user.id)) return interaction.reply({content: "Du bist bereits in der Erinnerung!", ephemeral: true});

    users.push(interaction.user.id);
    collection.updateOne({ messageId: interaction.message.id }, { $set: { users: users } });
    return interaction.reply({content: "Du bist jetzt in der Erinnerung!", ephemeral: true});
}

export async function remindMeDelete(interaction: ButtonInteraction) {
    const collection = databaseManager.db.collection("remindme");
    const reminder = await collection.findOne({ messageId: interaction.message.id });
    if (!reminder) return interaction.reply({content: "Diese Erinnerung existiert nicht mehr!", ephemeral: true});

    const users = reminder.users;
    if (!users.includes(interaction.user.id)) return interaction.reply({content: "Du bist nicht in der Erinnerung!", ephemeral: true});

    users.splice(users.indexOf(interaction.user.id), 1);

    if (users.length == 0) {
        await collection.deleteOne({ messageId: interaction.message.id });
        return interaction.reply({content: "Du bist nicht mehr in der Erinnerung!",ephemeral: true});
    }
    collection.updateOne({ messageId: interaction.message.id }, { $set: { users: users } });
    return interaction.reply({content: "Du bist nicht mehr in der Erinnerung!", ephemeral: true});
}

async function onRestart(){
    const collection = databaseManager.db.collection("remindme");
    const reminders = await collection.find().toArray();
    reminders.forEach(async (reminder) => {
        const currentDate = new Date(getUnixTime(getZonedTime(new Date(), timezone)));
        const finalDate = new Date(reminder.date);
        if (finalDate.getTime() < currentDate.getTime()) {
            const channel = await botManager.client.channels.fetch(reminder.channelId);
            if(!channel.isTextBased()) return;
            const users = reminder.users;
            const embed = new EmbedBuilder();
            embed.setTitle("Erinnerung");
            embed.setDescription(`${reminder.message}`);

            await channel?.send({content: `<@${users.join('>, <@')}>`, embeds: [embed]});
            await collection.deleteOne({ messageId: reminder.messageId });
        }else{
            setTimeout(async () => {
                const channel = await botManager.client.channels.fetch(reminder.channelId);
                if(!channel.isTextBased()) return;
                const users = reminder.users;
                const embed = new EmbedBuilder();
                embed.setTitle("Erinnerung");
                embed.setDescription(`${reminder.message}`);

                await channel?.send({content: `<@${users.join('>, <@')}>`, embeds: [embed]});
                await collection.deleteOne({ messageId: reminder.messageId });
            }, finalDate.getTime() - currentDate.getTime());
        }
    })
}

botManager.client.once("ready", async () => {
    onRestart();
});