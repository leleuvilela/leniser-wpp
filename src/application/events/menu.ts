import { type Message } from "whatsapp-web.js";

const menuMessage = `Menu

1. \`!ping\` - Verifica se o bot está ativo e responde com "pong".
2. \`!checagem\` - Checagem da peça.
3. \`!sticker\` - Converte uma imagem em sticker
4. \`!aa\` - Alcoolicos Anônimos
5. \`!mp3\` - Converte um áudio ou vídeo em mp3.
6. \`!ranking <dia/semana/mes>\` - Mostra o ranking de mensagens do grupo.
7. \`!transcrever\` - Transcreve uma mensagem de áudio para texto.
8. \`!bot [prompt]\` - Interage com o chat GPT.
9. \`!fala [prompt]\` - Faz o bot gerar um audio.
10. \`!imagem [prompt]\` - Faz o bot gerar uma imagem com base no prompt (use com moderação).

Exemplo: 
\`\`\`
!fala o deuita roubou pão na casa do joão
\`\`\``;

function handleMenu(msg: Message): Promise<Message> {
    return msg.reply('🤖 ' + menuMessage);
}

export { handleMenu };
