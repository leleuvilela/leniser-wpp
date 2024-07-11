import { Message, MessageMedia } from "whatsapp-web.js";
import { generateResponse } from "../helpers/generateResponse";

async function handleBot(msg: Message) {

    // only !bot, needs to be a media or a quoted message (reply)
    if (msg.body === '!bot' && hasValidMedia(msg) && !msg.hasQuotedMsg) {
        return msg.reply('🤖 Preciso de uma mensagem para responder.')
    }

    let prompt: string | null;
    let media: MessageMedia | null;
    let quoted = await msg.getQuotedMessage()

    if (hasValidMedia(msg)) {
        media = await msg.downloadMedia();
    } else if (hasValidMedia(quoted)) {
        media = await quoted.downloadMedia();
    }

    if (msg.body === '!bot' && msg.hasQuotedMsg) {
        prompt = quoted.body;
    } else {
        prompt = msg.body
    }

    if (media) {
        const res = await generateResponse(msg.body, media.data)
        return msg.reply(`🤖 ${res}`)
    }

    const res = await generateResponse(prompt)

    return msg.reply(`🤖 ${res}`)
}

function hasValidMedia(msg: Message | null): boolean {
    return msg?.hasMedia && (msg?.type === 'image' || msg?.type === 'sticker')
}

export { handleBot }
