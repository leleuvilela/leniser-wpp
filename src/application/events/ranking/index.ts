import { inject, injectable } from 'inversify';
import { type Message } from 'whatsapp-web.js';
import { TYPES } from '../../../ioc/types';
import { IGroupMembersRepository } from '../../contracts/IGroupMembersRepository';
import { IHandler } from '../../contracts/IHandler';
import { IMessageRepository } from '../../contracts/IMessagesRepository';
import { GroupMembers } from '../../dtos/groupMembers';
import { Member, MemberPermission } from '../../dtos/members';
import { hasPermissions } from '../../../utils/hasPermissions';
import { getBRDateNow } from '../../../utils/dateExtensions';
import { RankingParameters, RankingType } from './rankingParameters';
import { generateMessage } from './rankingMessageGenerator';

interface RankingFilters {
    startDate: Date;
    endDate: Date;
}

@injectable()
export class RankingHandler implements IHandler {
    public command = '!ranking';

    @inject(TYPES.MessageRepository) messageRepository: IMessageRepository;
    @inject(TYPES.GroupMembersRepository) groupMembersRepository: IGroupMembersRepository;

    canHandle(msg: Message, member: Member | null): boolean {
        if (!msg.body.startsWith(this.command)) {
            return false;
        }

        return hasPermissions(member, [MemberPermission.MESSAGE_CREATE], msg);
    }

    async handle(msg: Message, member: Member): Promise<Message> {
        const parameters = new RankingParameters(msg);

        if (!parameters) {
            return msg.reply('🤖 Comando inválido. Tente `!menu`.');
        }

        const filters = this.getRankingFilters(parameters);

        const memberId = process.env.ENVIRONMENT === 'local' ? msg.to : member.id;

        const messageCounts = await this.messageRepository.getMessageCountsByUser(
            filters.startDate,
            filters.endDate,
            memberId
        );

        if (!messageCounts) {
            return msg.reply('🤖 Nenhuma mensagem encontrada.');
        }

        const members = await this.groupMembersRepository.getMembers(memberId);

        messageCounts.forEach((result) => {
            result.id = this.findName(result.id, members);
        });

        const message = generateMessage(parameters, messageCounts);

        return msg.reply(`🤖 ${message}`, undefined, { linkPreview: false });
    }

    getRankingFilters(parameters: RankingParameters): RankingFilters {
        const now = getBRDateNow();

        if (parameters.type === RankingType.DIA_ESPECIFICO) {
            return {
                startDate: new Date(parameters.day),
                endDate: new Date(parameters.day),
            };
        }

        if (parameters.type === RankingType.DIA_ATUAL) {
            return {
                startDate: this.getStartOfDay(now),
                endDate: now,
            };
        }

        if (parameters.type === RankingType.SEMANAL) {
            return {
                startDate: this.getStartOfWeek(now),
                endDate: now,
            };
        }

        if (parameters.type === RankingType.MENSAL) {
            return {
                startDate: this.getStartOfMonth(now),
                endDate: now,
            };
        }

        // Geral
        return {
            startDate: new Date(0), // Unix epoch start
            endDate: now,
        };
    }

    getStartOfDay(now: Date): Date {
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    getStartOfWeek(now: Date): Date {
        const firstDayOfWeek = now.getDate() - now.getDay();
        return new Date(now.getFullYear(), now.getMonth(), firstDayOfWeek);
    }

    getStartOfMonth(now: Date): Date {
        return new Date(now.getFullYear(), now.getMonth(), 1);
    }

    findName(id: string, members: GroupMembers | null): string {
        if (!members) return id;

        const memberKeys = Object.keys(members.members);

        const memberKey = memberKeys.find((key) => id?.startsWith(key));

        if (!memberKey) return id;

        return members.members[memberKey] || id;
    }
}
