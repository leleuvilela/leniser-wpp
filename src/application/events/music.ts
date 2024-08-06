import { injectable, inject } from 'inversify';
import { IHandler } from '../contracts/IHandler';
import { Message, MessageMedia } from 'whatsapp-web.js';
import { Member, MemberPermission } from '../dtos/members';
import { TYPES } from '../../ioc/types';
import { IMusicService } from '../contracts/IMusicService';
import { IConfigsRepository } from '../contracts/IConfigsRepository';

@injectable()
export class MusicHandler implements IHandler {
    @inject(TYPES.MusicService) musicService: IMusicService;
    @inject(TYPES.ConfigsRepository) configsRepository: IConfigsRepository;
    public command = '!musica';

    canHandle(msg: Message, member: Member | null): boolean {
        const isAuthorized =
            !!member && member.permissions.includes(MemberPermission.MESSAGE_CREATE);
        return isAuthorized && msg.body.startsWith(this.command);
    }

    async handle(msg: Message): Promise<Message> {
        const { defaultMemberConfigs } = await this.configsRepository.getDefaultConfigs();
        try {
            const prompt = msg.body.replace(this.command, '').trim();

            msg.reply(
                `${defaultMemberConfigs.botPrefix} Gerando música... (Leva em média 3 minutos)`
            );
            const musicFiles = await this.musicService.generate(prompt, false);
            if (!musicFiles) {
                return msg.reply(
                    `${defaultMemberConfigs.botPrefix} Ocorreu um erro ao gerar a música!`
                );
            }
            const music0 = musicFiles[0];
            const messageMedia = await MessageMedia.fromUrl(music0.audio_url, {
                unsafeMime: true,
            });
            return msg.reply(messageMedia);
        } catch (error) {
            console.error(error);
            return msg.reply(
                `${defaultMemberConfigs.botPrefix} Ocorreu um erro ao gerar a música!`
            );
        }
    }
}
