import { type Message } from "whatsapp-web.js";
import { IStartWithHandler } from "../contracts/IHandler";
import { IMessageRepository } from "../contracts/IMessagesRepository";
import { inject, injectable } from "inversify";
import { TYPES } from '../../ioc/types';
import { MessageCountDto } from "../dtos/messageCountDto";
import { IGroupMembersRepository } from "../contracts/IGroupMembersRepository";
import { GroupMembers } from "../dtos/members";

@injectable()
export class RankingHandler implements IStartWithHandler {
    public command = '!ranking';

    messageRepository: IMessageRepository;
    groupMembersRepository: IGroupMembersRepository;

    constructor(
        @inject(TYPES.MessageRepository) messageRepository: IMessageRepository,
        @inject(TYPES.GroupMembersRepository) groupMembersRepository: IGroupMembersRepository,
    ) {
        this.messageRepository = messageRepository;
        this.groupMembersRepository = groupMembersRepository;
    }

    async handle(msg: Message): Promise<Message> {
        let startDate: Date;
        let endDate: Date;
        let title: string;

        if (msg.body.toLowerCase() === `${this.command} dia`) {
            startDate = this.getStartOfDay();
            endDate = new Date();
            title = "Ranking do Dia";
        } else if (msg.body.toLowerCase() === `${this.command} semana`) {
            startDate = this.getStartOfWeek();
            endDate = new Date();
            title = "Ranking da Semana";
        } else if (msg.body.toLowerCase() === `${this.command} mes`) {
            startDate = this.getStartOfMonth();
            endDate = new Date();
            title = "Ranking do Mês";
        } else if (msg.body.toLowerCase() === `${this.command}`) {
            startDate = new Date(0); // Unix epoch start
            endDate = new Date();
            title = "Ranking Geral";
        } else {
            return msg.reply("🤖 Comando inválido. Tente `!menu`.");
        }

        const groupId = msg.from;

        const messageCounts = await this.messageRepository.getMessageCountsByUser(startDate, endDate, groupId);

        if (!messageCounts) {
            return msg.reply("🤖 Nenhuma mensagem encontrada.");
        }

        const members = await this.groupMembersRepository.getMembers(msg.from)
            ?? await this.groupMembersRepository.getMembers(msg.to);

        const response = await this.generateMessageCountsText(title, messageCounts, members);

        return msg.reply(`🤖 ${response}`, undefined, { linkPreview: false });
    }

    getStartOfDay(): Date {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    getStartOfWeek(): Date {
        const now = new Date();
        const firstDayOfWeek = now.getDate() - now.getDay();
        return new Date(now.getFullYear(), now.getMonth(), firstDayOfWeek);
    }

    getStartOfMonth(): Date {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    }

    async generateMessageCountsText(
        title: string,
        messageCounts: MessageCountDto[],
        members: GroupMembers | null
    ) {
        messageCounts.forEach((result) => {
            result.name = members?.members[result.name] || result.name;
        });

        let messageText = `📊 *${title}* 📊\n\n`;
        messageCounts.forEach((result, index) => {
            messageText += `${index + 1}º - 👤 ${result.name}: ${result.count}\n`;
        });

        return messageText;
    }
}
