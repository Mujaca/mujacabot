import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
const prisma = new PrismaClient();

export async function connectDatabase(){
    await prisma.$connect();
    console.log("Connected to database");
    backUpDatabase();

    setInterval(backUpDatabase, 1000 * 60 * 60 * 24);
}

async function backUpDatabase(){
    if(!fs.existsSync('./backup/')) fs.mkdirSync('./backup/');
    const keys = Object.keys(prisma).filter(key => !key.startsWith('_') && !key.startsWith('$'));
    for(let key of keys){
        const data = await prisma[key].findMany();
        fs.writeFileSync(`./backup/${key}.json`, JSON.stringify(data));
    }
}

export default {
    db: prisma
};