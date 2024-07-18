import { type Message } from "whatsapp-web.js";

interface Listener {
    event: string;
    listener: (msg: Message) => void;
}

export class MessageObserver {
    listeners: Listener[];

    constructor() {
        this.listeners = [];
    }

    public addListener(event: string, listener: (msg: Message) => Promise<void> | Promise<Message>) {
        this.listeners.push({ event, listener });
    }

    public notify(event: string, msg: Message) {
        this.listeners.forEach(listener => {
            if (listener.event === event) {
                listener.listener(msg);
            }
        });
    }
}
