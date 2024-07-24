import { type Client as WwebClient } from "whatsapp-web.js";
import { IApplication } from "./application/contracts/IApplication";
import { inject, injectable } from "inversify";
import { TYPES } from "./ioc/types";
import { IConfigsRepository } from "./application/contracts/IConfigsRepository";
import { IListener } from "./application/contracts/IListener";

@injectable()
class Application implements IApplication {
    @inject(TYPES.WwebClient) wweb: WwebClient;
    @inject(TYPES.AuthenticationListener) authenticationListener: IListener;
    @inject(TYPES.MessageCreateListener) messageCreateListener: IListener;
    @inject(TYPES.MessageRevokeListener) messageRevokeListener: IListener;
    @inject(TYPES.ConfigsRepository) configsRepository: IConfigsRepository;


    public async start() {
        console.log("Getting configs");
        await this.configsRepository.fetchConfigs();

        console.log("Starting wweb listeners");
        this.authenticationListener.initialize();
        this.messageCreateListener.initialize();
        this.messageRevokeListener.initialize();

        console.log("Initializing wwapweb client");
        this.wweb.initialize();
    }

    public async updateConfigs() {
        //TODO: implements a method to update configs to be called in a route
        console.log("Updating configs");
        this.configsRepository.fetchConfigs();
    }
}

export { Application };
