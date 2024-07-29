import { MessageMedia, MessageTypes, type Message } from 'whatsapp-web.js';
import { convertToMp3 } from '../../utils/convertToMp3';

export async function handleMp3(msg: Message): Promise<Message> {
    const quoted = await msg.getQuotedMessage();

    const allowedTypes = [MessageTypes.AUDIO, MessageTypes.VOICE, MessageTypes.VIDEO];

    if (!allowedTypes.find((type) => type === quoted?.type)) {
        return await msg.reply('🤖 Preciso de um audio ou vídeo para converter!');
    }

    try {
        const media = await quoted.downloadMedia();

        if (!media?.data) {
            return await msg.reply('🤖 Falha ao baixar a mídia!');
        }

        const outputBase64 = await convertToMp3(media);

        const inputfileName = msg.body.replace('!mp3', '').trim();

        const outputfileName = inputfileName ? `${inputfileName}.mp3` : 'converted.mp3';

        const responseMedia = new MessageMedia('audio/mp3', outputBase64, outputfileName);

        return await msg.reply(responseMedia, undefined, {
            sendMediaAsDocument: !!inputfileName,
        });
    } catch (error) {
        console.error('Error occurred:', error);
        return await msg.reply('🤖 Ocorreu um erro ao converter o audio!');
    }
}
