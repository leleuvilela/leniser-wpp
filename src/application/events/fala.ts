import { type Message, MessageMedia } from 'whatsapp-web.js';
import { IAudioService } from '../contracts/IAudioService';
import { IHandler } from '../contracts/IHandler';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../ioc/types';
import { Member, MemberPermission } from '../dtos/members';
import { hasPermissions } from '../../utils/hasPermissions';
import { IReqRegistersRepository } from '../contracts/IReqRegistersRepository';
import { ReqRegisterType } from '../dtos/reqRegister';

@injectable()
export class FalaHandler implements IHandler {
    @inject(TYPES.ReqRegistersRepository) reqRegistersRepository: IReqRegistersRepository;
    @inject(TYPES.AudioService) audioService: IAudioService;

    public command = '!fala';

    public canHandle(msg: Message, member: Member | null): boolean {
        if (!msg.body.startsWith(this.command)) {
            return false;
        }

        return hasPermissions(member, [MemberPermission.MESSAGE_CREATE], msg);
    }

    public async handle(msg: Message): Promise<Message> {
        const quoted = await msg.getQuotedMessage();
        let prompt = msg.body;

        if (msg.body === '!fala' && msg.hasQuotedMsg && !quoted.hasMedia) {
            prompt = quoted.body;
        }

        const textArray = prompt.split(' ');
        textArray.shift();
        const text = textArray.join(' ');

        const chat = await msg.getChat();

        try {
            await chat.sendStateRecording();
            const audio = await this.audioService.generateAudio(text);
            const audioBase64 = Buffer.from(audio).toString('base64');
            await chat.clearState();

            this.reqRegistersRepository.addRegister({
                author: msg.author,
                memberId: msg.from,
                timestamp: new Date(),
                type: ReqRegisterType.MUSIC,
            });

            return msg.reply(new MessageMedia('audio/mpeg', audioBase64));
        } catch {
            return msg.reply('🤖 Calma lá calabreso, isso aí não pode não.');
        }
    }
}
