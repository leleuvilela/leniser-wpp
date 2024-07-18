import { type MongoClient } from "mongodb";
import type OpenAI from "openai";
import { type Client as WwebClient } from "whatsapp-web.js";
import { MessageObserver } from "./observers/message";
import { AuthenticationListener } from "./listeners/authentication";
import { MessageCreateListener } from "./listeners/messageCreate";
import { MessageRevokeListener } from "./listeners/messageRevoke";

class Application {
    mongo: MongoClient;
    openai: OpenAI;
    wweb: WwebClient;
    messageObserver: MessageObserver;

    authenticationListener: AuthenticationListener;
    messageCreateListener: MessageCreateListener;
    messageRevokeListener: MessageRevokeListener;

    constructor(mongoClient: MongoClient, openaiClient: OpenAI, wwebClient: WwebClient) {
        this.mongo = mongoClient;
        this.openai = openaiClient;
        this.wweb = wwebClient;

        this.authenticationListener = new AuthenticationListener(wwebClient, mongoClient);
        this.messageCreateListener = new MessageCreateListener(wwebClient, mongoClient);
        this.messageRevokeListener = new MessageRevokeListener(wwebClient, mongoClient);
    }

    public initialize(): void {
        console.log("Starting message listeners");
        this.messageCreateListener.startListeners();

        console.log("Starting wweb listeners");
        this.authenticationListener.initialize();
        this.messageCreateListener.initialize();
        this.messageRevokeListener.initialize();

        console.log("Initializing wwapweb client");
        this.wweb.initialize();
    }

    public updateConfigs(): void {
        //TODO: implements a method to update configs to be called in a route
        console.log("Updating configs");
    }
}

export { Application };
