import { Message, MessageTypes } from "whatsapp-web.js";
import { generateTranscription } from "../helpers/generateTranscription";

async function handleTranscrever(msg: Message) {
    const quoted = await msg.getQuotedMessage();

    if (!quoted || (quoted.type !== MessageTypes.AUDIO && quoted.type !== MessageTypes.VOICE)) {
        return msg.reply('🤖 A mensagem precisa ser um áudio.')
    }

    const audio = await quoted.downloadMedia();
    const audioBuffer = Buffer.from(audio.data, 'base64');

    const translate = msg.body.split(' ').length > 1;

    const transcription = await generateTranscription(audioBuffer, translate);

    msg.reply(`🤖 ${transcription}`);
}

export { handleTranscrever }
