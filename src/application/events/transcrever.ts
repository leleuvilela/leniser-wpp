import { type Message, MessageTypes } from "whatsapp-web.js";
import { IStartWithHandler } from "../contracts/IHandler";
import { inject, injectable } from "inversify";
import { TYPES } from "../../ioc/types";
import { ITranscriptionService } from "../contracts/ITranscriptionService";

@injectable()
class TranscreverHandler implements IStartWithHandler {
    public command = '!transcrever';

    @inject(TYPES.TranscriptionService) transcriptionService: ITranscriptionService;

    public async handle(msg: Message): Promise<Message> {
        const quoted = await msg.getQuotedMessage();

        if (!quoted || (quoted.type !== MessageTypes.AUDIO && quoted.type !== MessageTypes.VOICE)) {
            return await msg.reply('🤖 A mensagem precisa ser um áudio.')
        }

        const chat = await msg.getChat();
        try {
            await chat.sendStateTyping();
            const audio = await quoted.downloadMedia();
            const audioBuffer = Buffer.from(audio.data, 'base64');

            if (!audio.data) {
                await chat.clearState();
                return msg.reply(`🤖 Parece que esse áudio não tá disponivel.`)
            }

            const translate = msg.body.split(' ').length > 1;
            const transcription = await this.transcriptionService.generateTranscription(audioBuffer, translate);

            await chat.clearState();

            return msg.reply(`🤖 ${transcription}`);
        } catch (e) {
            console.log(e)
            return await msg.reply(`🤖 eita, pera. algo de errado não está certo.`)
        }
    }
}

export { TranscreverHandler }
