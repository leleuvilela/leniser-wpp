import { inject, injectable } from 'inversify';
import { IHandler } from '../contracts/IHandler';
import { IMessageRepository } from '../contracts/IMessagesRepository';
import { IGroupMembersRepository } from '../contracts/IGroupMembersRepository';
import { TYPES } from '../../ioc/types';
import { Message } from 'whatsapp-web.js';
import { Member, MemberPermission } from '../dtos/members';
import { hasPermissions } from '../../utils/hasPermissions';
import { getBRDateNow } from '../../utils/dateExtensions';
import { MessageCountDto } from '../dtos/messageCountDto';

@injectable()
export class MensagensPorDiaHandler implements IHandler {
    public command = '!msgsdia';

    private days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

    @inject(TYPES.MessageRepository) messageRepository: IMessageRepository;
    @inject(TYPES.GroupMembersRepository) groupMembersRepository: IGroupMembersRepository;

    canHandle(msg: Message, member: Member | null): boolean {
        if (!msg.body.startsWith(this.command)) {
            return false;
        }

        return hasPermissions(member, [MemberPermission.MESSAGE_CREATE], msg);
    }

    async handle(msg: Message, member: Member): Promise<Message> {
        const memberId = process.env.ENVIRONMENT === 'local' ? msg.to : member.id;

        const now = getBRDateNow();
        const messageCounts = await this.messageRepository.getMessageCountsByDay(
            now,
            memberId
        );

        let messageText = `📊 *Mensagens por Dia* 📊\n\n`;

        const totalMessages = this.getTotalMessages(messageCounts);

        messageText += `Total de ${totalMessages} mensagens\n\n`;

        messageCounts.forEach((result, index) => {
            const date = new Date(result.id);
            const dayOfWeek = this.days[date.getDay()];

            messageText += `${index + 1}º - *${result.id} - ${dayOfWeek}:* ${result.count} mensagens\n`;
        });

        return msg.reply(`🤖 ${messageText}`, undefined, { linkPreview: false });
    }

    getStartOfMonth(now: Date): Date {
        return new Date(now.getFullYear(), now.getMonth(), 1);
    }

    getTotalMessages(messageCounts: MessageCountDto[]) {
        return messageCounts.reduce((acc, result) => acc + result.count, 0);
    }
}
