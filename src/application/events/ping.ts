import { type Message } from 'whatsapp-web.js';

function handlePing(msg: Message): Promise<Message> {
    return msg.reply('🤖 pong');
}

export { handlePing };
