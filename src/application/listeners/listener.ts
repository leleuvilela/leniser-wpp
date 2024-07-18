import { type MongoClient } from "mongodb";
import { type Client as WwebClient } from "whatsapp-web.js";

class Listener {
    wwebClient: WwebClient;
    mongoClient: MongoClient | null;

    constructor(wwebClient: WwebClient, mongoClient: MongoClient | null) {
        this.wwebClient = wwebClient;
        this.mongoClient = mongoClient;
    }
}

export { Listener };
