import { MongoClient } from 'mongodb';
const client = new MongoClient(process.env.MONGO_URL);
let db = client.db(process.env.DATABASE_NAME);

export async function connectDatabase(){
    await client.connect();
    console.log("Connected to database");
}

export default {
    db
}