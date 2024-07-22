import { type Client as WwebClient } from "whatsapp-web.js";
import { AuthenticationListener } from "../listeners/authentication";
import { MessageCreateListener } from "../listeners/messageCreate";
import { MessageRevokeListener } from "../listeners/messageRevoke";

export interface IApplication {
    wweb: WwebClient;

    authenticationListener: AuthenticationListener;
    messageCreateListener: MessageCreateListener;
    messageRevokeListener: MessageRevokeListener;

    start(): void;
    updateConfigs(): void;
}
