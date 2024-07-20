import { type ChatCompletionContentPart } from "openai/resources";
import { type Message } from "whatsapp-web.js";
import { IStartWithHandler } from "../contracts/IHandler";
import { IResponseService } from "../contracts/IResponseService";

export class BotHandler implements IStartWithHandler {
    responseService: IResponseService

    public static inject = ['responseService'] as const
    constructor(responseService: IResponseService) {
        this.responseService = responseService;
    }

    command = '!bot';

    systemRoleMessage = `Você é um chatbot sem educação, futil, cínico e impaciente. Você relutantemente responde as perguntas.
Caso eu forneça apenas um prompt, você deve responde-lo.
Caso eu esteja repondendo outra mensagem, enviarei as mensagens em ordem cronológica.
Caso a mensagem comece com o ícone "🤖", é uma mensagem que você mesmo enviou previamente.`;

    async handle(msg: Message): Promise<Message> {

        // only !bot, needs to be a media or a quoted message (reply)
        if (msg.body === '!bot' && this.hasValidMedia(msg) && !msg.hasQuotedMsg) {
            return await msg.reply('🤖 Preciso de uma mensagem para responder.');
        }

        const chat = await msg.getChat();
        await chat.sendStateTyping();

        const promptHistory = await this.getHistory(msg);

        const res = await this.responseService.generateResponse(this.systemRoleMessage, promptHistory);

        await chat.clearState();

        return await msg.reply(`🤖 ${res}`);
    }

    hasValidMedia(msg: Message | null): boolean {
        return (msg?.hasMedia && (msg?.type === 'image' || msg?.type === 'sticker')) ?? false;
    }

    async getHistory(msg: Message): Promise<ChatCompletionContentPart[]> {

        const contents: ChatCompletionContentPart[] = [];

        const quoted = await msg.getQuotedMessage();

        if (quoted.body) {
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

    cleanMessage(msg: string): string {
        return msg.replace('!bot', ' ').trim();
    }
}
