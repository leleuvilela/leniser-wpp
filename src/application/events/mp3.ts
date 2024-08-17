import { MessageMedia, MessageTypes, type Message } from 'whatsapp-web.js';
import { convertToMp3 } from '../../utils/convertToMp3';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../ioc/types';
import { IConfigsRepository } from '../contracts/IConfigsRepository';
import { IHandler } from '../contracts/IHandler';
import { Member, MemberPermission } from '../dtos/members';
import { hasPermissions } from '../../utils/hasPermissions';
import { Logger } from 'winston';

@injectable()
export class Mp3Handler implements IHandler {
    @inject(TYPES.ConfigsRepository) configsRepository: IConfigsRepository;
    @inject(TYPES.Logger) logger: Logger;

    public command = '!mp3';

    canHandle(msg: Message, member: Member | null): boolean {
        if (!msg.body.startsWith(this.command)) {
            return false;
        }

        return hasPermissions(member, [MemberPermission.MESSAGE_CREATE], msg);
    }

    async handle(msg: Message): Promise<Message> {
        const quoted = await msg.getQuotedMessage();

        const allowedTypes = [MessageTypes.AUDIO, MessageTypes.VOICE, MessageTypes.VIDEO];

        if (!allowedTypes.find((type) => type === quoted?.type)) {
            return await msg.reply('🤖 Preciso de um audio ou vídeo para converter!');
        }

        try {
            const media = await quoted.downloadMedia();

            if (!media?.data) {
                return await msg.reply('🤖 Falha ao baixar a mídia!');
            }

            const outputBase64 = await convertToMp3(media);

            const inputfileName = msg.body.replace(this.command, '').trim();

            const outputfileName = inputfileName
                ? `${inputfileName}.mp3`
                : 'converted.mp3';

            const responseMedia = new MessageMedia(
                'audio/mp3',
                outputBase64,
                outputfileName
            );

            return await msg.reply(responseMedia, undefined, {
                sendMediaAsDocument: !!inputfileName,
            });
        } catch (error) {
            this.logger.error('🤖 Error on convert media: ', error);
            return await msg.reply('🤖 Ocorreu um erro ao converter o audio!');
        }
    }
}
