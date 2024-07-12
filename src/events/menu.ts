import { Message } from "whatsapp-web.js";

const menuMessage = `Menu

1. \`!ping\` - Verifica se o bot está ativo e responde com "pong".
2. \`!checagem\` - Checagem da peça.
3. \`!sticker\` - Converte uma imagem em sticker
4. \`!aa\` - Alcoolicos Anônimos
5. \`!ranking <dia/semana/mes>\` - Mostra o ranking de mensagens do grupo.
6. \`!transcrever\` - Transcreve uma mensagem de áudio para texto.
7. \`!bot [prompt]\` - Interage com o chat GPT.
8. \`!fala [prompt]\` - Faz o bot gerar um audio.
9. \`!imagem [prompt]\` - Faz o bot gerar uma imagem com base no prompt (use com moderação).

Exemplo: 
\`\`\`
!fala o deuita roubou pão na casa do joão
\`\`\``;

function handleMenu(msg: Message) {
    msg.reply('🤖 ' + menuMessage);
}

export { handleMenu };
