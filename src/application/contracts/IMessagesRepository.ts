import { MessageCountDto } from "../dtos/messageCountDto";

export interface IMessageRepository {
    addMessage: (msg: any) => Promise<boolean>;
    getMessageCountsByUser(startDate: Date, endDate: Date): Promise<MessageCountDto[]>;
}
