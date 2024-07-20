import { type Message } from "whatsapp-web.js";
import { IHandler, IStartWithHandler, MessageHandler } from "../contracts/IHandler";

export class MessageObserver {
    handlers: IHandler[];
    startsWithHandlers: IStartWithHandler[];

    constructor() {
        this.handlers = [];
    }

    public addHandler(listener: IHandler) {
        this.handlers.push(listener);
    }

    public addStartWithHandler(handler: IHandler | IStartWithHandler) {
        if ((<IHandler>handler).handle) {
            this.handlers.push((<IHandler>handler));
            return;
        }
        this.startsWithHandlers.push(<IStartWithHandler>handler);
    }

    public addStartWithMessageHandler(command: string, handle: MessageHandler) {
        this.startsWithHandlers.push({ command, handle });
    }

    public notify(msg: Message) {
        this.handlers.forEach(handler => {
            if (handler.canHandle(msg)) {
                handler.handle(msg);
            }
        });

        this.startsWithHandlers.forEach(handler => {
            if (msg.body.startsWith(handler.command)) {
                handler.handle(msg);
            }
        });
    }
}
