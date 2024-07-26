import { type ChatCompletionContentPart } from "openai/resources";
import { type Message } from "whatsapp-web.js";
import { IStartWithHandler } from "../contracts/IHandler";
import { IResponseService } from "../contracts/IResponseService";
import { TYPES } from '../../ioc/types';
import { inject, injectable } from "inversify";
import { IConfigsRepository } from "../contracts/IConfigsRepository";
import { IMembersRepository } from "../contracts/INumberPermissionsRepository";

@injectable()
export class BotHandler implements IStartWithHandler {
    public command = '!bot';

    @inject(TYPES.ResponseService) responseService: IResponseService;
    @inject(TYPES.ConfigsRepository) configsRepository: IConfigsRepository;
    @inject(TYPES.MembersRepository) membersRepository: IMembersRepository;

    public async handle(msg: Message): Promise<Message> {
        const member = await this.membersRepository.find(msg.from);

        if (!member) {
            return msg.reply('🤖 Você não está cadastrado no sistema.');
        }

        const { botPrefix, systemPrompt } = member.configs;

        // only !bot, needs to be a media or a quoted message (reply)
        if (msg.body === '!bot' && this.hasValidMedia(msg) && !msg.hasQuotedMsg) {
            return await msg.reply('🤖 Preciso de uma mensagem para responder.');
        }

        const chat = await msg.getChat();
        await chat.sendStateTyping();

        const promptHistory = await this.getHistory(msg);

        const res = await this.responseService.generateResponse(systemPrompt, promptHistory);

        await chat.clearState();

        return await msg.reply(`${botPrefix} ${res}`);
    }

    private hasValidMedia(msg: Message | null): boolean {
        return (msg?.hasMedia && (msg?.type === 'image' || msg?.type === 'sticker')) ?? false;
    }

    private async getHistory(msg: Message): Promise<ChatCompletionContentPart[]> {

        const contents: ChatCompletionContentPart[] = [];

        const quoted = await msg.getQuotedMessage();

        if (quoted?.body) {
            const history = await this.getHistory(quoted);
            contents.push(...history);
        }

        const media = msg.hasMedia ? await msg.downloadMedia() : null;
        const body = msg.body ? this.cleanMessage(msg.body) : '';

        if (body) {
            contents.push({
                type: "text",
                text: body
            });
        }

        if (media) {
            contents.push({
                type: "image_url",
                image_url: {
                    url: `data:image/jpeg;base64,${media.data}`
                }
            });
        }

        return contents;
    }

    private cleanMessage(msg: string): string {
        return msg.replace('!bot', ' ').trim();
    }
}
