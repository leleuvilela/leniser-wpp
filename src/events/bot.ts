import { Message } from "whatsapp-web.js";
import { generateResponse } from "../helpers/generateResponse";

async function handleBot(msg: Message) {
    if (msg.hasMedia && msg.type === 'image') {
        const media = await msg.downloadMedia();
        const res = await generateResponse(msg.body, media.data)
        msg.reply(`🤖 ${res}`)
    } else {
        const res = await generateResponse(msg.body)
        msg.reply(`🤖 ${res}`)
    }
}

export { handleBot }
