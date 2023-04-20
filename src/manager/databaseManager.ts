import { MongoClient } from 'mongodb';
import * as dotenv from "dotenv";
dotenv.config();

const client = new MongoClient(process.env.MONGO_URI);
let db = client.db(process.env.DATABASE_NAME);

export async function connectDatabase(){
    await client.connect();
    console.log("Connected to database");
}

export default {
    db
}