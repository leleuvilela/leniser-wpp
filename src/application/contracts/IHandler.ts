import type { Message } from "whatsapp-web.js";
import { Member } from "../dtos/members";

export type MessageHandler = ((msg: Message, member?: Member) => Promise<Message>)

export interface IHandler {
    canHandle(msg: Message): boolean;
    handle: MessageHandler;
}

export interface IStartWithHandler {
    command: string;
    handle: MessageHandler;
}

