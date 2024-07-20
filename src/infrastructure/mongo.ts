import 'dotenv/config';
import { MongoClient, ServerApiVersion } from 'mongodb';

export class Mongo {
    client: MongoClient | null;

    constructor(uri: string | undefined) {
        if (uri) {
            this.client = new MongoClient(uri, {
                serverApi: {
                    version: ServerApiVersion.v1,
                    strict: true,
                    deprecationErrors: true,
                }
            });
        }
    }
}
