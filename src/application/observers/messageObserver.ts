import { type Message } from "whatsapp-web.js";
import { IHandler, IStartWithHandler, MessageHandler } from "../contracts/IHandler";
import { injectable } from "inversify";

@injectable()
export class MessageObserver {
    handlers: IHandler[];
    startsWithHandlers: IStartWithHandler[];

    constructor() {
        this.handlers = [];
        this.startsWithHandlers = [];
    }

    public addHandler(listener: IHandler) {
        this.handlers.push(listener);
    }

    public addStartWithHandler(handler: IStartWithHandler) {
        this.startsWithHandlers.push(handler);
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
