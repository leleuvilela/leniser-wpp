import { type Message } from "whatsapp-web.js";

async function handleSticker(msg: Message): Promise<Message> {

    const quoted = await msg.getQuotedMessage();

    if (msg.type !== 'image' && quoted?.type !== 'image') {
        return await msg.reply('🤖 Preciso de uma imagem para gerar um sticker!');
    }

    const message = msg.hasMedia ? msg : quoted;

    try {
        const media = await message.downloadMedia();
        return msg.reply(media, undefined, {
            sendMediaAsSticker: true,
            stickerName: 'Sticker',
            stickerAuthor: 'Bot maluco'
        });
    } catch (error) {
        return msg.reply('🤖 Shiiii... deu ruim');
    }
}

export { handleSticker };
