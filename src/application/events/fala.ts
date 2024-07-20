import { type Message, MessageMedia } from "whatsapp-web.js";
import { IAudioService } from "../contracts/IAudioService";
import { IStartWithHandler } from "../contracts/IHandler";

export class FalaHandler implements IStartWithHandler {
    audioService: IAudioService

    public static inject = ['audioService'] as const;

    constructor(audioService: IAudioService) {
        this.audioService = audioService;
    }

    command = '!fala';

    async handle(msg: Message): Promise<Message> {

        const quoted = await msg.getQuotedMessage();
        let prompt = msg.body;

        if (msg.body === '!fala' && msg.hasQuotedMsg && !quoted.hasMedia) {
            prompt = quoted.body;
        }

        const textArray = prompt.split(' ');
        textArray.shift();
        const text = textArray.join(" ");

        const chat = await msg.getChat();
        try {
            await chat.sendStateRecording();
            const audio = await this.audioService.generateAudio(text);
            const audioBase64 = Buffer.from(audio).toString('base64');
            await chat.clearState();
            return msg.reply(new MessageMedia('audio/mpeg', audioBase64));
        } catch {
            return msg.reply('🤖 Calma lá calabreso, isso aí não pode não.');
        }
    }
}
