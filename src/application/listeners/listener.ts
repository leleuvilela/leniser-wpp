import { type Client as WwebClient } from "whatsapp-web.js";

export interface Listener {
    initialize(): void;
}

export abstract class Listener implements Listener {
    wwebClient: WwebClient;

    constructor(wwebClient: WwebClient) {
        this.wwebClient = wwebClient;
    }
}
