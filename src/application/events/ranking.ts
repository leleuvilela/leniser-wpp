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
    membersRepository: IGroupMembersRepository;

    constructor(
        @inject(TYPES.MessageRepository) messageRepository: IMessageRepository,
        @inject(TYPES.GroupMembersRepository) membersRepository: IGroupMembersRepository,
    ) {
        this.messageRepository = messageRepository;
        this.membersRepository = membersRepository;
    }

    async handle(msg: Message): Promise<Message> {
        let startDate: Date;
        let endDate: Date;
        let title: string;

        if (msg.body.toLowerCase() === "!ranking dia") {
            startDate = this.getStartOfDay();
            endDate = new Date();
            title = "Ranking do Dia";
        } else if (msg.body.toLowerCase() === "!ranking semana") {
            startDate = this.getStartOfWeek();
            endDate = new Date();
            title = "Ranking da Semana";
        } else if (msg.body.toLowerCase() === "!ranking mes") {
            startDate = this.getStartOfMonth();
            endDate = new Date();
            title = "Ranking do Mês";
        } else if (msg.body.toLowerCase() === "!ranking") {
            startDate = new Date(0); // Unix epoch start
            endDate = new Date();
            title = "Ranking Geral";
        } else {
            return msg.reply("🤖 Comando inválido. Tente `!menu`.");
        }

        const messageCounts = await this.messageRepository.getMessageCountsByUser(startDate, endDate);

        if (!messageCounts) {
            return msg.reply("🤖 Nenhuma mensagem encontrada.");
        }

        const members = await this.membersRepository.getMembers(msg.from)
            ?? await this.membersRepository.getMembers(msg.to);

        if (!members) {
            return msg.reply("🤖 Grupo não possui membros cadastrados");
        }

        const response = await this.generateMessageCountsText(title, messageCounts, members);

        return msg.reply(`🤖 ${response}`);
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
        members: GroupMembers
    ) {
        messageCounts.forEach((result) => {
            result.name = members.members[result.name] || result.name;
        });

        let messageText = `📊 *${title}* 📊\n\n`;
        messageCounts.forEach((result, index) => {
            messageText += `${index + 1}º - 👤 ${result.name}: ${result.count}\n`;
        });

        return messageText;
    }
}
