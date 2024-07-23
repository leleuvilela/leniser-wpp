import { Message } from "whatsapp-web.js";
import { IHandler } from "../contracts/IHandler";
import { injectable } from "inversify";

@injectable()
export class GilsoHandler implements IHandler {
    gilsoId = '556283282310@c.us';

    canHandle(msg: Message): boolean {
        return msg.from === this.gilsoId && Math.random() < 0.15
    }

    handle(msg: Message): Promise<Message> {
        return msg.reply('🤖 cala boca seu corrupto')
    }
}
