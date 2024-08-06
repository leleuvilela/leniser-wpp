import { MessageCountDto } from '../dtos/messageCountDto';
import { IMessage } from '../dtos/message';

export interface IMessageRepository {
    addMessage: (msg: IMessage) => Promise<boolean>;
    getMessageCountsByUser(
        startDate: Date,
        endDate: Date,
        groupId: string
    ): Promise<MessageCountDto[]>;
}
