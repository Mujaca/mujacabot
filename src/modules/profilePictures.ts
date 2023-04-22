import { profilePicture } from "../@types/profilePictures";
import { Module } from "../classes/module";
import databaseManager from "../manager/databaseManager";
import botManager from "../manager/botManager";
import scheduleManager from "../manager/scheduleManager";

export class profilePictures extends Module {
    constructor() {
        super("profilePictures");
        botManager.client.once("ready", this.checkProfilePictures);
        scheduleManager.addRunner(this.checkProfilePictures, 1000 * 60 * 60 * 24, "profilePictures");
    }

    async checkProfilePictures() {
        const collection = databaseManager.db.collection<profilePicture>("profile-pictures");
        const guilds = botManager.client.guilds.cache.map(guild => guild);
        for (const guild of guilds) {
            const members = (await guild.members.fetch()).map(member => member);
            for (const member of members) {
                const profilePicture = await collection.findOne({ userID: member.id });
                if (!profilePicture || profilePicture.picture !== member.user.displayAvatarURL()) {
                    await collection.insertOne({
                        userID: member.id,
                        picture: member.user.displayAvatarURL(),
                        created_at: new Date()
                    });
                }
            }
        }
    }
}