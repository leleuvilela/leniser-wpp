import { Message, MessageMedia } from "whatsapp-web.js";
import { generateAudio } from "../helpers/generateAudio";

async function handleFala(msg: Message) {
    const textArray = msg.body.split(' ');
    textArray.shift();
    const text = textArray.join(" ")

    try {
        const audio = await generateAudio(text)
        const audioBase64 = Buffer.from(audio).toString('base64')
        msg.reply(new MessageMedia('audio/mpeg', audioBase64));
    } catch {
        msg.reply('🤖 Calma lá calabreso, isso aí não pode não.')
    }
}

export { handleFala };
