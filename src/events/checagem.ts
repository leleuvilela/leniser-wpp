import { Message, Poll } from "whatsapp-web.js";
import { wwebClient } from "../clients/wweb";

function handleChecagem(msg: Message) {
    wwebClient.sendMessage(msg.from, new Poll(`🍆🍆🍆 CHECAGEM DA PEÇA NO GRUPO 🍆🍆🍆`, ['MOLE', 'MEIA BOMBA', 'DURA', 'TOMEI UM TADALA']));
}

export { handleChecagem };
