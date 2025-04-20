import type { Message } from 'whatsapp-web.js';

export type MessageHandler = (msg: Message) => Promise<Message>;

export interface IHandler {
    canHandle(msg: Message): boolean;
    handle: MessageHandler;
}
