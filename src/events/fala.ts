import { Message, MessageMedia } from "whatsapp-web.js";
import { generateAudio } from "../services/generateAudio";

async function handleFala(msg: Message) {

    let quoted = await msg.getQuotedMessage()
    let prompt = msg.body

    if (msg.body === '!fala' && msg.hasQuotedMsg && !quoted.hasMedia) {
        prompt = quoted.body;
    }

    const textArray = prompt.split(' ');
    textArray.shift();
    const text = textArray.join(" ")

    const chat = await msg.getChat()
    try {
        await chat.sendStateRecording()
        const audio = await generateAudio(text)
        const audioBase64 = Buffer.from(audio).toString('base64')
        await chat.clearState()
        msg.reply(new MessageMedia('audio/mpeg', audioBase64));
    } catch {
        msg.reply('🤖 Calma lá calabreso, isso aí não pode não.')
    }
}

export { handleFala };
