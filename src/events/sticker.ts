import { Message } from "whatsapp-web.js";

async function handleSticker(msg: Message) {

    const quoted = await msg.getQuotedMessage()

    if (msg.type !== 'image' && quoted?.type !== 'image') {
        return msg.reply('🤖 Preciso de uma imagem para gerar um sticker!')
    }

    const message = msg.hasMedia ? msg : quoted

    try {
        const media = await message.downloadMedia()
        return msg.reply(media, null, {
            sendMediaAsSticker: true,
            stickerName: 'Sticker',
            stickerAuthor: 'Bot maluco'
        })
    } catch(error){
        msg.reply('🤖 Shiiii... deu ruim')
    }
}

export { handleSticker }
