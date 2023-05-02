import { ChatInputCommandInteraction, EmbedBuilder, InteractionResponse } from "discord.js";
import axios from "axios";
import databaseManager from "../../../manager/databaseManager";
import { apiResponse, apiWish, wishData } from "../../../@types/StarRail";
import botManager from "../../../manager/botManager";

const GACHA_TYPES = {
    "Standard": 1,
    "Beginner": 2,
    "Event": 11,
    "WeaponEvent": 12,
}
const RANK_TYPES = {
    "3 Star": '3',
    "4 Star": '4',
    "5 Star": '5',
}

export async function getWishStatistic(interaction: ChatInputCommandInteraction) {
   const reply = await interaction.deferReply();
    const dataBaseRefresh = await updateDatabase(interaction.user.id);

    if(dataBaseRefresh != true) return replyToDefer(reply, interaction, dataBaseRefresh, 5000);

    const dataCollection = databaseManager.db.collection('starrail-data');
    const data = await dataCollection.find({userID: interaction.user.id}).toArray();
    const embed = new EmbedBuilder();
    embed.setTitle("Wunschstatistik");
    embed.setDescription(`<@${interaction.user.id}> hat insgesamt ${data.length} Wünsche abgegeben!`);
    embed.setColor("#ff0000");
    // Create Overall Wishes
    let dataByType:any = {};
    for(let type of Object.values(GACHA_TYPES)) {
        dataByType[type] = data.filter((entry) => entry.gacha_type == type).length.toString();
    }
    let dataByrank:any = {};
    for(let type of Object.values(GACHA_TYPES)) {
        dataByrank[type] = data.filter((entry) => entry.gacha_type == type).length.toString();
        dataByrank[type] = []
        for(let rank of Object.values(RANK_TYPES)) {
            dataByrank[type].push(data.filter((entry) => entry.rank_type == rank && entry.gacha_type == type).length.toString())
        }
    }
    //Calculate Pitty
    let pitty:any = {};
    for(let type of Object.values(GACHA_TYPES)) {
        const dataByType = data.filter((entry) => entry.gacha_type == type);
        let lastFiveStar:any;

        for(let dataEntry of dataByType) {
            if(dataEntry.rank_type == 5) {
                lastFiveStar = dataEntry;
            }
        }
        console.log(JSON.stringify(lastFiveStar))

        if(lastFiveStar == undefined) pitty[type] = dataByType.length.toString();
        else pitty[type] = dataByType.filter(entry => entry.id > lastFiveStar.id).length.toString();
    }

    embed.addFields([
        {name: "Standard", value: dataByType[1]},
        {name: "3 Star", value: dataByrank[1][0], inline: true},
        {name: "4 Star", value: dataByrank[1][1], inline: true},
        {name: "5 Star", value: dataByrank[1][2], inline: true},
        {name: "Pitty", value: `${pitty[1]}/90`, inline: true},
        {name: "Beginner", value: dataByType[2]},
        {name: "3 Star", value: dataByrank[2][0], inline: true},
        {name: "4 Star", value: dataByrank[2][1], inline: true},
        {name: "5 Star", value: dataByrank[2][2], inline: true},
        {name: "Pitty", value: `${pitty[2]}/50`, inline: true},
        {name: "Event", value: dataByType[11]},
        {name: "3 Star", value: dataByrank[11][0], inline: true},
        {name: "4 Star", value: dataByrank[11][1], inline: true},
        {name: "5 Star", value: dataByrank[11][2], inline: true},
        {name: "Pitty", value: `${pitty[11]}/90`, inline: true},
        {name: "WeaponEvent", value: dataByType[12]},
        {name: "3 Star", value: dataByrank[12][0], inline: true},
        {name: "4 Star", value: dataByrank[12][1], inline: true},
        {name: "5 Star", value: dataByrank[12][2], inline: true},
        {name: "Pitty", value: `${pitty[12]}/80`, inline: true},
    ]);
    reply.delete();
    const channel = await botManager.client.channels.fetch(interaction.channelId);
    if (channel.isTextBased()) {
        const message = await channel.send({ embeds: [embed] });
        return message;
    }
}

async function updateDatabase(userID: string) {
    const authArray = await databaseManager.db.collection('starrail-auth').find({userID: userID}).toArray();
    if(authArray.length == 0) return "No Authkey given or Authkey expired!";
    const authkey = authArray[0].authkey;

    const dataCollection = databaseManager.db.collection('starrail-data');
    for(let type of Object.values(GACHA_TYPES)) {
        let data = (await getWishData(authkey, type, 1, 20)).data as wishData[];
        const lastEntry = await dataCollection.find({userID: userID, gacha_type: type}).limit(1).toArray();
        
        if(lastEntry.length != 0) data = data.filter((entry) => new Date(entry.time) > new Date(lastEntry[0].time));
        
        for(let index in data) {
            data[index].userID = userID;
            data[index].gacha_type = type;
        }

        if(data.length !=0 ) await dataCollection.insertMany(data);

    }

    return true;
}

async function getWishData(authKey: string, gacha_type: number, page: number, size: number, end_id?: number): Promise<{data: apiWish[], nextPage: boolean}> {
    let data:apiWish[] = []

    const response = await axios.get<apiResponse>(`https://api-os-takumi.mihoyo.com/common/gacha_record/api/getGachaLog?authkey_ver=1&sign_type=2&auth_appid=webview_gacha&win_mode=fullscreen&gacha_id=dbebc8d9fbb0d4ffa067423482ce505bc5ea&timestamp=${Math.floor(new Date().getTime() / 1000)}&region=prod_official_usa&default_gacha_type=${gacha_type}&lang=en&authkey=${authKey}&game_biz=hkrpg_global&9&plat_type=pc&page=${page}&size=${size}&gacha_type=${gacha_type}&end_id=${end_id || 0}`)
    if (response.data.retcode != 0 || response.data.data.list.length == 0) return {data: data, nextPage: false};
    data = response.data.data.list;

    const nextPage = await getWishData(authKey, gacha_type, page + 1, size, data[data.length - 1].id);
    if(nextPage.data.length != 0) data = data.concat(nextPage.data);
    else return {data: data, nextPage: false};

    return {data: data, nextPage: true};
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