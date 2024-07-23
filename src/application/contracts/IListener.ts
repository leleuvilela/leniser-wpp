import { type Client as WwebClient } from "whatsapp-web.js";

export interface IListener {
    wwebClient: WwebClient;
    initialize(): void | Promise<void>;
}
