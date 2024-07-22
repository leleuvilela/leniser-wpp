import { type Client as WwebClient } from "whatsapp-web.js";
import { AuthenticationListener } from "./application/listeners/authentication";
import { MessageCreateListener } from "./application/listeners/messageCreate";
import { MessageRevokeListener } from "./application/listeners/messageRevoke";
import { IApplication } from "./application/contracts/IApplication";
import { inject, injectable } from "inversify";
import { TYPES } from "./ioc/types";

@injectable()
class Application implements IApplication {
    wweb: WwebClient;

    authenticationListener: AuthenticationListener;
    messageCreateListener: MessageCreateListener;
    messageRevokeListener: MessageRevokeListener;

    constructor(
        @inject(TYPES.AuthenticationListener) authenticationListener: AuthenticationListener,
        @inject(TYPES.MessageCreateListener) messageCreateListener: MessageCreateListener,
        @inject(TYPES.MessageRevokeListener) messageRevokeListener: MessageRevokeListener,
        @inject(TYPES.WwebClient) wweb: WwebClient
    ) {
        this.authenticationListener = authenticationListener;
        this.messageCreateListener = messageCreateListener;
        this.messageRevokeListener = messageRevokeListener;
        this.wweb = wweb;
    }

    public start(): void {
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
