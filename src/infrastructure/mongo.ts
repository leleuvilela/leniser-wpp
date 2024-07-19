import 'dotenv/config';
import { MongoClient, ServerApiVersion } from 'mongodb';

const uri = process.env.DB_URI;

let mongoClient: MongoClient | null;

if (uri) {

    mongoClient = new MongoClient(uri, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        }
    });
}

export { mongoClient };
