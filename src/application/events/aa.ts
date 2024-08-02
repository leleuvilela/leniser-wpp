import { injectable, inject } from 'inversify';
import { type Message } from 'whatsapp-web.js';
import { TYPES } from '../../ioc/types';
import { IConfigsRepository } from '../contracts/IConfigsRepository';
import { IHandler } from '../contracts/IHandler';
import { Member, MemberPermission } from '../dtos/members';

const aaMessage = `Olá! 🍀

Beber com moderação é importante para a saúde e o bem-estar. Se você ou alguém que você conhece está enfrentando problemas com o consumo de álcool, saiba que não está sozinho.

Alcoólicos Anônimos (AA) é uma comunidade de apoio que oferece ajuda a quem deseja parar de beber. Eles têm grupos de apoio em várias localidades e também oferecem reuniões online.

Contato do Alcoólicos Anônimos:

📞 Telefone Nacional: 0800-725-6366
🌐 Site: www.alcoolicosanonimos.org.br

Mensagem Importante:
Lembre-se de que pedir ajuda é um sinal de força, e há pessoas dispostas a ajudar você a superar esse desafio. Você não está sozinho nessa jornada.

Cuide-se e fique bem! 💚`;

@injectable()
export class AaHandler implements IHandler {
    @inject(TYPES.ConfigsRepository) configsRepository: IConfigsRepository;

    public command = '!aa';

    canHandle(msg: Message, member: Member | null): boolean {
        if (!msg.body.startsWith(this.command)) {
            return false;
        }

        if (process.env.ENVIRONMENT === 'local' && msg.fromMe) {
            return true;
        }

        return !!member && member.permissions.includes(MemberPermission.MESSAGE_CREATE);
    }

    async handle(msg: Message): Promise<Message> {
        const { defaultMemberConfigs } = await this.configsRepository.getDefaultConfigs();

        return msg.reply(`${defaultMemberConfigs.botPrefix} ${aaMessage}`);
    }
}
