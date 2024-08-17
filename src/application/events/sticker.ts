import { injectable, inject } from 'inversify';
import { MessageTypes, type Message } from 'whatsapp-web.js';
import { TYPES } from '../../ioc/types';
import { IConfigsRepository } from '../contracts/IConfigsRepository';
import { IHandler } from '../contracts/IHandler';
import { Member, MemberPermission } from '../dtos/members';
import { hasPermissions } from '../../utils/hasPermissions';
import { Logger } from 'winston';

@injectable()
export class StickerHandler implements IHandler {
    @inject(TYPES.ConfigsRepository) configsRepository: IConfigsRepository;
    @inject(TYPES.Logger) logger: Logger;

    public command = '!sticker';

    canHandle(msg: Message, member: Member | null): boolean {
        if (!msg.body.startsWith(this.command)) {
            return false;
        }

        return hasPermissions(member, [MemberPermission.MESSAGE_CREATE], msg);
    }

    async handle(msg: Message): Promise<Message> {
        const quoted = await msg.getQuotedMessage();

        const allowedTypes = [MessageTypes.IMAGE, MessageTypes.VIDEO];

        if (!allowedTypes.includes(msg.type) && !allowedTypes.includes(quoted?.type)) {
            return await msg.reply(
                '🤖 Preciso de uma imagem ou vídeo para gerar um sticker!'
            );
        }

        const message = msg.hasMedia ? msg : quoted;

        try {
            const media = await message.downloadMedia();

            if (!media?.data) {
                return await msg.reply('🤖 Falha ao baixar a mídia!');
            }

            return msg.reply(media, undefined, {
                sendMediaAsSticker: true,
                stickerName: 'Sticker',
                stickerAuthor: 'Bot da Lenise',
            });
        } catch (error) {
            this.logger.error('🤖 Error on download media: ', error);
            return msg.reply('🤖 Shiiii... deu ruim');
        }
    }
}
