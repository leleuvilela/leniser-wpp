import { MongoClient } from "mongodb";
import { Client as WwebClient } from "whatsapp-web.js";
import { MessageObserver } from "../observers/message";

class Listener {
    wwebClient: WwebClient;
    mongoClient: MongoClient;
    messageObserver: MessageObserver;

    constructor(wwebClient: WwebClient, mongoClient: MongoClient, messageObserver: MessageObserver) {
        this.wwebClient = wwebClient;
        this.mongoClient = mongoClient;
        this.messageObserver = messageObserver;
    }

    public async initialize() { }
}

export { Listener };
