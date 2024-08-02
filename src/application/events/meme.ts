import { injectable, inject } from 'inversify';
import { MessageMedia, type Message } from 'whatsapp-web.js';
import { TYPES } from '../../ioc/types';
import { IConfigsRepository } from '../contracts/IConfigsRepository';
import { IHandler } from '../contracts/IHandler';
import { IImgflipService } from '../contracts/IImgflipService';
import { Member, MemberPermission } from '../dtos/members';
import { hasPermissions } from '../../utils/hasPermissions';

@injectable()
export class MemeHandler implements IHandler {
    @inject(TYPES.ConfigsRepository) configsRepository: IConfigsRepository;
    @inject(TYPES.ImgflipService) imgflipService: IImgflipService;

    public command = '!meme';

    canHandle(msg: Message, member: Member): boolean {
        if (!msg.body.startsWith(this.command)) {
            return false;
        }

        return hasPermissions(member, [MemberPermission.MESSAGE_CREATE], msg);
    }

    async handle(msg: Message): Promise<Message> {
        const text = msg.body.replace(this.command, '').trim();

        const meme = await this.imgflipService.searchMeme(text);

        if (!meme) {
            return msg.reply(
                '🤖 Meme não encontrado, a busca funciona melhor em inglês.'
            );
        }

        const messageMedia = await MessageMedia.fromUrl(meme.url);

        return msg.reply(messageMedia);
    }
}