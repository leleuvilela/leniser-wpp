import { type Message } from 'whatsapp-web.js';
import { IHandler } from '../contracts/IHandler';
import { injectable } from 'inversify';
import { Member } from '../dtos/members';

@injectable()
export class MessageObserver {
    handlers: IHandler[];

    constructor() {
        this.handlers = [];
    }

    public addHandler(listener: IHandler) {
        this.handlers.push(listener);
    }

    public notify(msg: Message, member: Member | null) {
        this.handlers.forEach((handler) => {
            if (handler.canHandle(msg, member)) {
                handler.handle(msg, member);
            }
        });
    }
}
