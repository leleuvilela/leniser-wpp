import { type Message } from 'whatsapp-web.js';
import { IHandler } from '../contracts/IHandler';
import { injectable } from 'inversify';

@injectable()
export class MessageObserver {
    handlers: IHandler[];

    constructor() {
        this.handlers = [];
    }

    public addHandler(listener: IHandler) {
        this.handlers.push(listener);
    }

    public notify(msg: Message) {
        this.handlers.forEach((handler) => {
            if (handler.canHandle(msg)) {
                handler.handle(msg);
            }
        });
    }
}
