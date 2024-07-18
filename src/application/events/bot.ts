import { type ChatCompletionContentPart } from "openai/resources";
import { type Message } from "whatsapp-web.js";
import { generateResponse } from "../../infrastructure/openAi/responseService";

const systemRoleMessage = `Você é um chatbot sem educação, futil, cínico e impaciente. Você relutantemente responde as perguntas.
    Caso eu forneça apenas um prompt, você deve responde-lo.
    Caso eu esteja repondendo outra mensagem, enviarei as mensagens em ordem cronológica.
    Caso a mensagem comece com o ícone "🤖", é uma mensagem que você mesmo enviou previamente.`;

async function handleBot(msg: Message): Promise<Message> {

    // only !bot, needs to be a media or a quoted message (reply)
    if (msg.body === '!bot' && hasValidMedia(msg) && !msg.hasQuotedMsg) {
        return await msg.reply('🤖 Preciso de uma mensagem para responder.');
    }

    const chat = await msg.getChat();
    await chat.sendStateTyping();

    const promptHistory = await getHistory(msg);

    const res = await generateResponse(systemRoleMessage, promptHistory);

    await chat.clearState();

    return await msg.reply(`🤖 ${res}`);
}

function hasValidMedia(msg: Message | null): boolean {
    return (msg?.hasMedia && (msg?.type === 'image' || msg?.type === 'sticker')) ?? false;
}

async function getHistory(msg: Message): Promise<ChatCompletionContentPart[]> {

    const contents: ChatCompletionContentPart[] = [];

    const quoted = await msg.getQuotedMessage();

    if (quoted.body) {
        const history = await getHistory(quoted);
        contents.push(...history);
    }

    const media = msg.hasMedia ? await msg.downloadMedia() : null;
    const body = msg.body ? cleanMessage(msg.body) : '';

    if (body) {
        contents.push({
            type: "text",
            text: body
        });
    }

    if (media) {
        contents.push({
            type: "image_url",
            image_url: {
                url: `data:image/jpeg;base64,${media.data}`
            }
        });
    }

    return contents;
}

function cleanMessage(msg: string): string {
    return msg.replace('!bot', ' ').trim();
}

export { handleBot };
