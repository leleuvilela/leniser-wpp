import type { Message } from 'whatsapp-web.js';
import { Member } from '../dtos/members';

export type MessageHandler = (msg: Message, member: Member | null) => Promise<Message>;

export interface IHandler {
    canHandle(msg: Message, member: Member | null): boolean;
    handle: MessageHandler;
}
