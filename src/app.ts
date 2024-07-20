import { type MongoClient } from "mongodb";
import { type OpenAI } from "openai";
import { type Client as WwebClient } from "whatsapp-web.js";
import { MessageObserver } from "./application/observers/messageObserver";
import { AuthenticationListener } from "./application/listeners/authentication";
import { MessageCreateListener } from "./application/listeners/messageCreate";
import { MessageRevokeListener } from "./application/listeners/messageRevoke";

class Application {
    mongo: MongoClient | null;
    openai: OpenAI;
    wweb: WwebClient;
    messageObserver: MessageObserver;

    authenticationListener: AuthenticationListener;
    messageCreateListener: MessageCreateListener;
    messageRevokeListener: MessageRevokeListener;

    public static inject = ['authenticationListener', 'messageCreateListener', 'messageRevokeListener'] as const;

    constructor(
        authenticationListener: AuthenticationListener,
        messageCreateListener: MessageCreateListener,
        messageRevokeListener: MessageRevokeListener
        ) {
        this.authenticationListener = authenticationListener;
        this.messageCreateListener = messageCreateListener;
        this.messageRevokeListener = messageRevokeListener;
    }

    public initialize(): void {
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
