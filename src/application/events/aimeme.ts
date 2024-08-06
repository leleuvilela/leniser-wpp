import { injectable, inject } from 'inversify';
import { MessageMedia, type Message } from 'whatsapp-web.js';
import { TYPES } from '../../ioc/types';
import { IConfigsRepository } from '../contracts/IConfigsRepository';
import { IHandler } from '../contracts/IHandler';
import { IImgflipService } from '../contracts/IImgflipService';
import { Member, MemberPermission } from '../dtos/members';

@injectable()
export class AiMemeHandler implements IHandler {
    @inject(TYPES.ConfigsRepository) configsRepository: IConfigsRepository;
    @inject(TYPES.ImgflipService) imgflipService: IImgflipService;

    public command = '!aimeme';

    canHandle(msg: Message, member: Member): boolean {
        const isAuthorized =
            !!member && member.permissions.includes(MemberPermission.MESSAGE_CREATE);

        return isAuthorized && msg.body.startsWith(this.command);
    }

    async handle(msg: Message): Promise<Message> {
        const text = msg.body.replace(this.command, '').trim();

        const meme = await this.imgflipService.aiMeme(text);

        if (!meme) {
            return msg.reply('🤖 Não consegui gerar esse meme.');
        }

        const messageMedia = await MessageMedia.fromUrl(meme.url);

        return msg.reply(messageMedia);
    }
}
