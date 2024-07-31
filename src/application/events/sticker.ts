import { injectable, inject } from 'inversify';
import { MessageTypes, type Message } from 'whatsapp-web.js';
import { TYPES } from '../../ioc/types';
import { IConfigsRepository } from '../contracts/IConfigsRepository';
import { IHandler } from '../contracts/IHandler';
import { Member, MemberPermission } from '../dtos/members';

@injectable()
export class StickerHandler implements IHandler {
    @inject(TYPES.ConfigsRepository) configsRepository: IConfigsRepository;

    public command = '!sticker';

    canHandle(msg: Message, member: Member | null): boolean {
        const isAuthorized =
            !!member && member.permissions.includes(MemberPermission.MESSAGE_CREATE);

        return isAuthorized && msg.body.startsWith(this.command);
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
            console.error('🤖 Error on download media: ', error);
            return msg.reply('🤖 Shiiii... deu ruim');
        }
    }
}
