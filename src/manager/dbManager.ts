import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function connectDatabase(){
    await prisma.$connect();
    console.log("Connected to database");
}

export default {
    db: prisma
};