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
3. \`!vainele\` - Vai nele?
4. \`!sticker\` - Converte uma imagem em sticker.
5. \`!aa\` - Alcoolicos Anônimos
6. \`!mp3\` - Converte um áudio ou vídeo em mp3.
7. \`!ranking <dia/semana/mes> <graph>\` - Mostra o ranking de mensagens do grupo, com opção de gráfico.
8. \`!msgsdia\` - Mostra a quantidade de mensagem por dia.
9. \`!transcrever\` - Transcreve uma mensagem de áudio para texto.
10. \`!bot [prompt]\` - Interage com o chat GPT.
11. \`!fala [prompt]\` - Faz o bot gerar um audio.
12. \`!imagem [prompt]\` - Faz o bot gerar uma imagem com base no prompt (use com moderação).
13. \`!musica [prompt]\` - Faz o bot gerar uma musica com base no prompt (use com moderação).

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
