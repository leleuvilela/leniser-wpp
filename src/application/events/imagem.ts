import { type Message, MessageMedia } from 'whatsapp-web.js';
import { createCooldownFunction } from '../../utils/createCooldown';
import { generateImage } from '../../infrastructure/services/imageService';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../ioc/types';
import { IConfigsRepository } from '../contracts/IConfigsRepository';
import { IHandler } from '../contracts/IHandler';
import { Member, MemberPermission } from '../dtos/members';
import { hasPermissions } from '../../utils/hasPermissions';

const disableCooldown = process.env.IMAGE_COOLDOWN_DISABLED === 'true';

if (disableCooldown) {
    console.log('🤖 Cooldown de imagem desabilitado');
} else {
    console.log('🤖 Cooldown de imagem habilitado');
}

const cooldownSeconds = process.env.IMAGE_COOLDOWN_SECONDS
    ? parseInt(process.env.IMAGE_COOLDOWN_SECONDS)
    : 120;

const generateImageCd = createCooldownFunction(generateImage, cooldownSeconds);

@injectable()
export class ImagemHandler implements IHandler {
    @inject(TYPES.ConfigsRepository) configsRepository: IConfigsRepository;

    public command = '!imagem';

    canHandle(msg: Message, member: Member | null): boolean {
        if (!msg.body.startsWith(this.command)) {
            return false;
        }

        return hasPermissions(member, [MemberPermission.MESSAGE_CREATE], msg);
    }

    async handle(msg: Message): Promise<Message> {
        const text = msg.body.replace(this.command, '').trim();

        try {
            const imageRes = disableCooldown
                ? await generateImage(text)
                : await generateImageCd(text);

            if (!imageRes || !imageRes.data[0]?.b64_json) {
                return msg.reply('🤖 Pera aí, tá em cooldown...');
            }

            const imageBase64 = imageRes.data[0]?.b64_json;
            return msg.reply(new MessageMedia('image/jpeg', imageBase64));
        } catch (error) {
            console.log(error);
            return msg.reply('🤖 Calma lá calabreso, isso aí não pode não.');
        }
    }
}
