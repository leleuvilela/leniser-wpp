import 'dotenv/config';
import { type Message, MessageMedia } from 'whatsapp-web.js';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../ioc/types';
import { IConfigsRepository } from '../contracts/IConfigsRepository';
import { IHandler } from '../contracts/IHandler';
import { Member, MemberPermission } from '../dtos/members';
import { hasPermissions } from '../../utils/hasPermissions';
import { IReqRegistersRepository } from '../contracts/IReqRegistersRepository';
import { IImageService } from '../contracts/IImageService';
import { ReqRegisterType } from '../dtos/reqRegister';

@injectable()
export class ImagemHandler implements IHandler {
    @inject(TYPES.ConfigsRepository) configsRepository: IConfigsRepository;
    @inject(TYPES.ReqRegistersRepository) reqRegistersRepository: IReqRegistersRepository;
    @inject(TYPES.ImageService) imageService: IImageService;

    public command = '!imagem';

    canHandle(msg: Message, member: Member | null): boolean {
        if (!msg.body.startsWith(this.command)) {
            return false;
        }

        return hasPermissions(member, [MemberPermission.MESSAGE_CREATE], msg);
    }

    async handle(msg: Message, member: Member): Promise<Message> {
        const text = msg.body.replace(this.command, '').trim();
        const { botPrefix, imageCooldownEnabled, imageCooldownTime } = member.configs
            ? member.configs
            : (await this.configsRepository.getDefaultConfigs()).defaultMemberConfigs;

        try {
            const lastReq = await this.reqRegistersRepository.getLastRegisterByMember(
                msg.from,
                ReqRegisterType.IMAGE
            );

            if (lastReq && imageCooldownEnabled) {
                const now = new Date();
                const diff = now.getTime() - lastReq.timestamp.getTime();
                const diffInMinutes = Math.floor(diff / 60000);

                if (diffInMinutes < imageCooldownTime) {
                    return msg.reply(`${botPrefix} Pera aí, tá em cooldown...`);
                }
            }

            const imageRes = await this.imageService.generateImage(text);

            const [image] = imageRes.data;

            if (!image || !image.b64_json) {
                return msg.reply(`${botPrefix} Algo errado não está certo.`);
            }

            this.reqRegistersRepository.addRegister({
                author: msg.author,
                memberId: msg.from,
                timestamp: new Date(),
                type: ReqRegisterType.IMAGE,
            });

            return msg.reply(new MessageMedia('image/jpeg', image.b64_json));
        } catch (error) {
            console.log(error);
            return msg.reply(`${botPrefix} Calma lá calabreso, isso aí não pode não.`);
        }
    }
}
