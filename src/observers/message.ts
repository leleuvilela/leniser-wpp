import { Message } from "whatsapp-web.js";

interface Listener {
    event: string;
    listener: (msg: Message) => void;
}

export class MessageObserver {
    listeners: Listener[];

    constructor() {
        this.listeners = [];
    }

    addListener(event: string, listener: (msg: Message) => void) {
        this.listeners.push({ event, listener });
    }

    notify(event: string, msg: Message) {
        this.listeners.forEach(listener => {
            if (listener.event === event) {
                listener.listener(msg);
            }
        });
    }
}
