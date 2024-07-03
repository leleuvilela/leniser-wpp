import { Message } from "whatsapp-web.js";

function handlePing(msg: Message) {
    msg.reply('🤖 pong');
}

export { handlePing };
