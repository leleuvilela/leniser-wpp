import { type MongoClient } from "mongodb";
import { type Client as WwebClient } from "whatsapp-web.js";
import { MessageObserver } from "../observers/message";

class Listener {
    wwebClient: WwebClient;
    mongoClient: MongoClient;
    messageObserver: MessageObserver;

    constructor(wwebClient: WwebClient, mongoClient: MongoClient) {
        this.wwebClient = wwebClient;
        this.mongoClient = mongoClient;
        this.messageObserver = new MessageObserver();
    }
}

export { Listener };
