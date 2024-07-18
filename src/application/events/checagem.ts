import { type Message, Poll } from "whatsapp-web.js";

function handleChecagem(msg: Message): Promise<Message> {
    return msg.reply(new Poll(`🍆🍆🍆 CHECAGEM DA PEÇA NO GRUPO 🍆🍆🍆`, ['MOLE', 'MEIA BOMBA', 'DURA', 'TOMEI UM TADALA']));
}

export { handleChecagem };
