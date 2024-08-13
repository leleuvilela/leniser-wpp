import { type ChatCompletionContentPart } from 'openai/resources';
import { MessageTypes, type Message } from 'whatsapp-web.js';
import { IHandler } from '../contracts/IHandler';
import { IResponseService } from '../contracts/IResponseService';
import { TYPES } from '../../ioc/types';
import { inject, injectable } from 'inversify';
import { IConfigsRepository } from '../contracts/IConfigsRepository';
import { Member, MemberPermission } from '../dtos/members';
import { ITranscriptionService } from '../contracts/ITranscriptionService';
import { hasPermissions } from '../../utils/hasPermissions';
import { IReqRegistersRepository } from '../contracts/IReqRegistersRepository';
import { ReqRegisterType } from '../dtos/reqRegister';

@injectable()
export class BotHandler implements IHandler {
    public command = '!bot';

    @inject(TYPES.ResponseService) responseService: IResponseService;
    @inject(TYPES.ConfigsRepository) configsRepository: IConfigsRepository;
    @inject(TYPES.TranscriptionService) transcriptionService: ITranscriptionService;
    @inject(TYPES.ReqRegistersRepository) reqRegistersRepository: IReqRegistersRepository;

    canHandle(msg: Message, member: Member | null): boolean {
        if (!msg.body.startsWith(this.command)) {
            return false;
        }

        return hasPermissions(member, [MemberPermission.MESSAGE_CREATE], msg);
    }

    public async handle(msg: Message, member: Member): Promise<Message> {
        const { botPrefix, systemPrompt } = member.configs
            ? member.configs
            : (await this.configsRepository.getDefaultConfigs()).defaultMemberConfigs;

        // only !bot, needs to be a media or a quoted message (reply)
        if (msg.body === '!bot' && this.hasValidMedia(msg) && !msg.hasQuotedMsg) {
            return await msg.reply('🤖 Preciso de uma mensagem para responder.');
        }

        const chat = await msg.getChat();
        await chat.sendStateTyping();

        const promptHistory = await this.getHistory(msg);

        const res = await this.responseService.generateResponse(
            systemPrompt,
            promptHistory
        );

        await chat.clearState();

        this.reqRegistersRepository.addRegister({
            author: msg.author,
            memberId: msg.from,
            timestamp: new Date(),
            type: ReqRegisterType.TEXT,
        });

        return await msg.reply(`${botPrefix} ${res}`);
    }

    private hasValidMedia(msg: Message | null): boolean {
        return (
            (msg?.hasMedia && (msg?.type === 'image' || msg?.type === 'sticker')) ?? false
        );
    }

    private async getHistory(msg: Message): Promise<ChatCompletionContentPart[]> {
        const contents: ChatCompletionContentPart[] = [];

        const quoted = await msg.getQuotedMessage();

        if (quoted) {
            const history = await this.getHistory(quoted);
            contents.push(...history);
        }

        const image = msg.type === MessageTypes.IMAGE ? await msg.downloadMedia() : null;
        const text = msg.body ? this.cleanMessage(msg.body) : '';
        const audio =
            msg.type === MessageTypes.AUDIO || msg.type === MessageTypes.VOICE
                ? await msg.downloadMedia()
                : null;

        if (text) {
            contents.push({
                type: 'text',
                text: text,
            });
        }

        if (image) {
            contents.push({
                type: 'image_url',
                image_url: {
                    url: `data:image/jpeg;base64,${image.data}`,
                },
            });
        }

        if (audio) {
            const audioBuffer = Buffer.from(audio.data, 'base64');
            const transcription =
                await this.transcriptionService.generateTranscription(audioBuffer);
            contents.push({
                type: 'text',
                text: `Isto é a transcrição de um áudio: ${transcription}`,
            });
        }

        return contents;
    }

    private cleanMessage(msg: string): string {
        return msg.replace('!bot', ' ').trim();
    }
}
