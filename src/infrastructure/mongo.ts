import 'dotenv/config';
import { MongoClient, ServerApiVersion } from 'mongodb';

//TODO: create a class and mock
export const mongoClient = new MongoClient(process.env.DB_URI || '', {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});
