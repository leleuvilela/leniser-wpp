import { type Message, MessageMedia } from 'whatsapp-web.js';
import { IAudioService } from '../contracts/IAudioService';
import { IHandler } from '../contracts/IHandler';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../ioc/types';
import { Member, MemberPermission } from '../dtos/members';
import { hasPermissions } from '../../utils/hasPermissions';

@injectable()
export class FalaHandler implements IHandler {
    audioService: IAudioService;

    constructor(@inject(TYPES.AudioService) audioService: IAudioService) {
        this.audioService = audioService;
    }

    command = '!fala';

    canHandle(msg: Message, member: Member | null): boolean {
        if (!msg.body.startsWith(this.command)) {
            return false;
        }

        return hasPermissions(member, [MemberPermission.MESSAGE_CREATE], msg);
    }

    async handle(msg: Message): Promise<Message> {
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
            return msg.reply(new MessageMedia('audio/mpeg', audioBase64));
        } catch {
            return msg.reply('🤖 Calma lá calabreso, isso aí não pode não.');
        }
    }
}
