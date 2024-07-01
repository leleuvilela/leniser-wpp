import 'dotenv/config'
import { MongoClient, ServerApiVersion } from 'mongodb';

const uri = process.env.DB_URI;

const mongoClient = new MongoClient(uri!, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

export { mongoClient }
