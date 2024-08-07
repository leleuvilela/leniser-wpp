import { inject, injectable } from 'inversify';
import { type Message } from 'whatsapp-web.js';
import { TYPES } from '../../ioc/types';
import { IConfigsRepository } from '../contracts/IConfigsRepository';
import { IHandler } from '../contracts/IHandler';
import { Member, MemberPermission } from '../dtos/members';
import { hasPermissions } from '../../utils/hasPermissions';

const menuMessage = `Menu

1. \`!ping\` - Verifica se o bot está ativo e responde com "pong".
2. \`!checagem\` - Checagem da peça.
3. \`!sticker\` - Converte uma imagem em sticker
4. \`!aa\` - Alcoolicos Anônimos
5. \`!mp3\` - Converte um áudio ou vídeo em mp3.
6. \`!ranking <dia/semana/mes> <graph>\` - Mostra o ranking de mensagens do grupo, com opção de gráfico.
7. \`!transcrever\` - Transcreve uma mensagem de áudio para texto.
8. \`!bot [prompt]\` - Interage com o chat GPT.
9. \`!fala [prompt]\` - Faz o bot gerar um audio.
10. \`!imagem [prompt]\` - Faz o bot gerar uma imagem com base no prompt (use com moderação).

Exemplo: 
\`\`\`
!fala o deuita roubou pão na casa do joão
\`\`\``;

@injectable()
export class MenuHandler implements IHandler {
    @inject(TYPES.ConfigsRepository) configsRepository: IConfigsRepository;

    public command = '!menu';

    canHandle(msg: Message, member: Member | null): boolean {
        if (!msg.body.startsWith(this.command)) {
            return false;
        }

        return hasPermissions(member, [MemberPermission.MESSAGE_CREATE], msg);
    }

    async handle(msg: Message): Promise<Message> {
        const { defaultMemberConfigs } = await this.configsRepository.getDefaultConfigs();

        return msg.reply(`${defaultMemberConfigs.botPrefix} ${menuMessage}`);
    }
}
