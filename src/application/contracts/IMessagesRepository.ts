import { Message } from "whatsapp-web.js";
import { MessageCountDto } from "../dtos/messageCountDto";

export interface IMessageRepository {
    addMessage: (msg: Message) => Promise<boolean>;
    getMessageCountsByUser(startDate: Date, endDate: Date, groupId: string): Promise<MessageCountDto[]>;
}
