import { inject, injectable } from "inversify";
import { type Message } from "whatsapp-web.js";
import { TYPES } from '../../ioc/types';
import { IGroupMembersRepository } from "../contracts/IGroupMembersRepository";
import { IStartWithHandler } from "../contracts/IHandler";
import { IMessageRepository } from "../contracts/IMessagesRepository";
import { GroupMembers } from "../dtos/groupMembers";
import { MessageCountDto } from "../dtos/messageCountDto";
import { Member } from "../dtos/members";

interface RankingConfigs {
    startDate: Date;
    endDate: Date;
    title: string;
    isGraph: boolean;
}

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

    async handle(msg: Message, member: Member): Promise<Message> {
        const cfgs = this.getRankingConfig(msg);

        if (!cfgs) {
            return msg.reply("🤖 Comando inválido. Tente `!menu`.");
        }

        const messageCounts = await this.messageRepository
            .getMessageCountsByUser(cfgs.startDate, cfgs.endDate, member.id);

        if (!messageCounts) {
            return msg.reply("🤖 Nenhuma mensagem encontrada.");
        }

        const members = await this.groupMembersRepository.getMembers(member.id)

        messageCounts.forEach((result) => {
            result.id = this.findName(result.id, members);
        });
        
        const response = cfgs.isGraph
            ? this.generateMessageGraph(cfgs.title, messageCounts)
            : this.generateMessageCountsText(cfgs.title, messageCounts);

        return msg.reply(`🤖 ${response}`, undefined, { linkPreview: false });
    }

    getRankingConfig(msg: Message): RankingConfigs | null {
        const endDate = new Date();

        const args = msg.body.split(' ');
        const lastArg = args[args.length - 1];
        const isGraph = lastArg === 'graph';

        if (msg.body.toLowerCase().startsWith(`${this.command} dia`)) {
            return {
                startDate: this.getStartOfDay(),
                endDate: endDate,
                title: "Ranking do Dia",
                isGraph: isGraph,
            }
        } else if (msg.body.toLowerCase().startsWith(`${this.command} semana`)) {
            return {
                startDate: this.getStartOfWeek(),
                endDate: endDate,
                title: "Ranking da Semana",
                isGraph: isGraph,
            }
        } else if (msg.body.toLowerCase().startsWith(`${this.command} mes`)) {
            return {
                startDate: this.getStartOfMonth(),
                endDate: endDate,
                title: "Ranking do Mês",
                isGraph: isGraph,
            }
        } else if (msg.body.toLowerCase().startsWith(`${this.command}`)) {
            return {
                startDate: new Date(0), // Unix epoch start
                endDate: new Date(),
                title: "Ranking Geral",
                isGraph: isGraph,
            }
        } else {
            return null;
        }
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

    generateMessageCountsText(
        title: string,
        messageCounts: MessageCountDto[]
    ) {
        let messageText = `📊 *${title}* 📊\n\n`;
        messageCounts.forEach((result, index) => {
            messageText += `${index + 1}º - 👤 ${result.id}: ${result.count}\n`;
        });

        return messageText;
    }

    generateMessageGraph(
        title: string,
        messageCounts: MessageCountDto[]
    ) {
        const bar = '#';

        const highestCount = messageCounts[0].count;
        const charCount = 30;
        const messagesPerBar = Math.floor(highestCount / charCount);

        let messageText = `📊 *${title}* 📊\n\n${bar} = ${messagesPerBar} mensagens\n\n`;

        messageCounts.forEach((result, index) => {
            const barLength = Math.floor(result.count / messagesPerBar);
            const barText = bar.repeat(barLength);

            messageText += `${index + 1}º - 👤 ${result.id}: (${result.count})\n${barText}\n`;
        });

        return messageText;
    }

    findName(id: string, members: GroupMembers | null): string {
        if (!members) return id;

        const memberKeys = Object.keys(members.members);

        const memberKey = memberKeys.find((key) => key.startsWith(id));

        if (!memberKey) return id;

        return members.members[memberKey] || id;
    }
}
