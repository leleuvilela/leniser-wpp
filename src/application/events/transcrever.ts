import { type Message, MessageTypes } from "whatsapp-web.js";
import { generateTranscription } from "../../infrastructure/openAi/transcriptionService";

async function handleTranscrever(msg: Message): Promise<Message> {
    const quoted = await msg.getQuotedMessage();

    if (!quoted || (quoted.type !== MessageTypes.AUDIO && quoted.type !== MessageTypes.VOICE)) {
        return await msg.reply('🤖 A mensagem precisa ser um áudio.')
    }

    const chat = await msg.getChat();
    try {
        await chat.sendStateTyping();
        const audio = await quoted.downloadMedia();
        const audioBuffer = Buffer.from(audio.data, 'base64');

        if (!audio.data) {
            await chat.clearState();
            return msg.reply(`🤖 Parece que esse áudio não tá disponivel.`)
        }

        const translate = msg.body.split(' ').length > 1;
        const transcription = await generateTranscription(audioBuffer, translate);

        await chat.clearState();

        return msg.reply(`🤖 ${transcription}`);
    } catch (e) {
        console.log(e)
        return await msg.reply(`🤖 eita, pera. algo de errado não está certo.`)
    }
}

export { handleTranscrever }
