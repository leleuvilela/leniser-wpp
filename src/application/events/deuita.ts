import { Message } from "whatsapp-web.js";
import { IHandler } from "../contracts/IHandler";
import { injectable } from "inversify";

@injectable()
export class DeuitaHandler implements IHandler {
    canHandle(msg: Message): boolean {
        return !msg.body.startsWith('🤖') && msg.body.toLowerCase().includes('deuita')
    }

    handle(msg: Message): Promise<Message> {
        return msg.reply('🤖 pau no cu do deuita')
    }
}
