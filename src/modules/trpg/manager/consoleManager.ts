import { ChatInputCommandInteraction } from "discord.js";
import dbManager from "../../../manager/dbManager";
import { generate } from "./aiManager";
import { disableCurrentWorld, setCurrentWorld } from "./worldManager";
import { broadcast, systemMessage } from "./webhookManager";

const consoleCommands = {
    createWorld
}

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

    const callback = consoleCommands[command];
    await callback(args, interaction);
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

export async function createWorld(args:string, interaction: ChatInputCommandInteraction) {
    const reply = await interaction.deferReply({ephemeral: true});
    const worldString = await generate('world', [
        { role: 'user', content: args }
    ])
    try {
        const world = JSON.parse(worldString);
        reply.edit({content: `Creating world: ${world.name}`});
        const dbworld = await dbManager.db.rPGWorld.create({
            data: {
                name: world.name,
                description: world.description,
                genre: args
            }
        });

        const city = await generate('city', [
            { role: 'user', content: dbworld.description }
        ], {world: dbworld.name, genre: dbworld.genre});
        const cityData = JSON.parse(city);
        await dbManager.db.rPGCity.create({
            data: {
                name: cityData.name,
                description: cityData.description,
                worldID: dbworld.id
            }
        });

        setTimeout(() => { systemMessage("Shutdown initiated") }, 1000 * 1);
        setTimeout(() => { systemMessage("Shutting down world system ...") }, 1000 * 5);
        setTimeout(() => { disableCurrentWorld() }, 1000 * 5);
        setTimeout(() => { systemMessage("Rebooting system for new world ...") }, 1000 * 10);
        setTimeout(() => { systemMessage("Generating new World ...") }, 1000 * 15);
        setTimeout(() => { systemMessage("Generating Terrain ...") }, 1000 * 20);
        setTimeout(() => { systemMessage("Preparing Citys ...") }, 1000 * 25);
        setTimeout(() => { systemMessage("Generating NPCs ...") }, 1000 * 30);
        setTimeout(() => { systemMessage("Setting Up Player Hook ...") }, 1000 * 40);
        setTimeout(() => { systemMessage("Changing Language to \"German\" ...") }, 1000 * 45);
        setTimeout(() => { systemMessage("Activating new World ...") }, 1000 * 35);
        setTimeout(async () => { await setCurrentWorld(dbworld); }, 1000 * 35);
        setTimeout(() => { systemMessage(`Herzlich Wilkommen in ${dbworld.name}:\n${dbworld.description}`) }, 1000 * 50);
        setTimeout(() => { systemMessage(`Ihr befindet euch in in ${cityData.name}:\n${cityData.description}`) }, 1000 * 55);

        return true;
    } catch (error) {
        console.log(error, worldString);
        reply.edit({content: `Error creating new World. Please try again later!`});
        return false;    
    }
}