import { injectable, inject } from 'inversify';
import { type Message } from 'whatsapp-web.js';
import { TYPES } from '../../ioc/types';
import { IConfigsRepository } from '../contracts/IConfigsRepository';
import { IHandler } from '../contracts/IHandler';
import { hasPermissions } from '../../utils/hasPermissions';
import { Member, MemberPermission } from '../dtos/members';
import { ChatCompletionContentPart } from 'openai/resources';
import { IResponseService } from '../contracts/IResponseService';
import { IGroupMembersRepository } from '../contracts/IGroupMembersRepository';
import { IReqRegistersRepository } from '../contracts/IReqRegistersRepository';
import { ReqRegisterType } from '../dtos/reqRegister';

@injectable()
export class ResumoHandler implements IHandler {
    @inject(TYPES.ConfigsRepository) configsRepository: IConfigsRepository;
    @inject(TYPES.ResponseService) responseService: IResponseService;
    @inject(TYPES.GroupMembersRepository) groupMembersRepository: IGroupMembersRepository;
    @inject(TYPES.ReqRegistersRepository) reqRegistersRepository: IReqRegistersRepository;

    public command = '!resumo';

    canHandle(msg: Message, member: Member): boolean {
        if (!msg.body.startsWith(this.command)) {
            return false;
        }

        return hasPermissions(member, [MemberPermission.MESSAGE_CREATE], msg);
    }

    async handle(msg: Message, member: Member): Promise<Message> {
        const { botPrefix } = member.configs
            ? member.configs
            : (await this.configsRepository.getDefaultConfigs()).defaultMemberConfigs;

        const limit = msg.body.replace(this.command, '').trim();
        if (limit && !Number(limit)) {
            return msg.reply('🤖 Isso não é um número válido.');
        }

        const chat = await msg.getChat();
        const messages = await chat.fetchMessages({
            fromMe: false,
            limit: limit ? Number(limit) : 50,
        });

        const memberId = process.env.ENVIRONMENT === 'local' ? msg.to : member.id;
        const contents = await this.generateChatCompletionContentPart(messages, memberId);

        const systemPrompt = `Vou te enviar várias mensagens de uma conversa de um grupo do
                whatsapp deste modelo: "{Autor}: {Mensagem}". Quero que você me responda com
                um resumo do que foi dito mencionando os nomes das pessoas sempre que for um nome legível.
                Faça a resposta como se fosse um integrante do grupo dizendo o que foi dito.`;

        const res = await this.responseService.generateResponse(systemPrompt, contents);

        this.reqRegistersRepository.addRegister({
            author: msg.author,
            memberId: msg.from,
            timestamp: new Date(),
            type: ReqRegisterType.TEXT,
        });

        return msg.reply(`${botPrefix} ${res}`);
    }

    private async generateChatCompletionContentPart(
        msgs: Message[],
        memberId: string
    ): Promise<ChatCompletionContentPart[]> {
        const contents: ChatCompletionContentPart[] = [];
        const { members } = (await this.groupMembersRepository.getMembers(memberId)) ?? {
            members: {},
        };

        for (const msg of msgs) {
            if (msg.type === 'chat') {
                const author = members[msg.author ?? ''] ?? msg.author;
                const text = `${author}: ${msg.body}`;

                const content: ChatCompletionContentPart = {
                    type: 'text',
                    text,
                };

                contents.push(content);
            }
        }

        return contents;
    }
}
