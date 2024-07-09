import { Message } from "whatsapp-web.js";

const menuMessage = `

1. **!ping** - Verifica se o bot está ativo e responde com "pong".
2. **!checagem** - Checagem da peça.
3. **!ranking** - Mostra o ranking de mensagens do grupo.
4. **!transcrever** - Transcreve uma mensagem de áudio para texto.
5. **!bot [prompt]** - Interage com o chat GPT.
6. **!fala [prompt]** - Faz o bot mandar audio de algo.
7. **!imagem [prompt]** - Faz o bot gerar uma imagem de algo (use com moderação).

Exemplo: 
\`\`\`
!fala o deuita roubou pão na casa do joão
\`\`\``;

function handleMenu(msg: Message) {
    msg.reply('🤖 ' + menuMessage);
}

export { handleMenu };
