import { MessageCountDto } from '../dtos/messageCountDto';
import { IMessage } from '../dtos/message';
import { Message } from 'whatsapp-web.js';

export interface IMessageRepository {
    addMessage: (msg: IMessage) => Promise<boolean>;
    addFullMessage: (msg: Message) => Promise<boolean>;
    getMessageCountsByUser(
        startDate: Date,
        endDate: Date,
        groupId: string
    ): Promise<MessageCountDto[]>;
}
