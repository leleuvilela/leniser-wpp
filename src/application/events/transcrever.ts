import { type Message, MessageTypes } from 'whatsapp-web.js';
import { TranscriptionService } from '../../infrastructure/services/transcriptionService';
import { IHandler } from '../contracts/IHandler';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../ioc/types';
import { Member, MemberPermission } from '../dtos/members';
import { hasPermissions } from '../../utils/hasPermissions';
import { IReqRegistersRepository } from '../contracts/IReqRegistersRepository';
import { ReqRegisterType } from '../dtos/reqRegister';

@injectable()
class TranscreverHandler implements IHandler {
    public command = '!transcrever';

    @inject(TYPES.TranscriptionService)
    transcriptionService: TranscriptionService;
    @inject(TYPES.ReqRegistersRepository) reqRegistersRepository: IReqRegistersRepository;

    canHandle(msg: Message, member: Member | null): boolean {
        if (!msg.body.startsWith(this.command)) {
            return false;
        }

        return hasPermissions(member, [MemberPermission.MESSAGE_CREATE], msg);
    }

    public async handle(msg: Message): Promise<Message> {
        const quoted = await msg.getQuotedMessage();

        if (
            !quoted ||
            (quoted.type !== MessageTypes.AUDIO && quoted.type !== MessageTypes.VOICE)
        ) {
            return await msg.reply('🤖 A mensagem precisa ser um áudio.');
        }

        const chat = await msg.getChat();
        try {
            await chat.sendStateTyping();
            const audio = await quoted.downloadMedia();
            const audioBuffer = Buffer.from(audio.data, 'base64');

            if (!audio.data) {
                await chat.clearState();
                return msg.reply(`🤖 Parece que esse áudio não tá disponivel.`);
            }

            const translate = msg.body.split(' ').length > 1;
            const transcription = await this.transcriptionService.generateTranscription(
                audioBuffer,
                translate
            );

            await chat.clearState();

            this.reqRegistersRepository.addRegister({
                author: msg.author,
                memberId: msg.from,
                timestamp: new Date(),
                type: ReqRegisterType.MUSIC,
            });

            return msg.reply(`🤖 ${transcription}`);
        } catch (e) {
            console.log(e);
            return await msg.reply(`🤖 eita, pera. algo de errado não está certo.`);
        }
    }
}

export { TranscreverHandler };
