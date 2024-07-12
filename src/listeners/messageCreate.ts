import { wwebClient } from "../clients/wweb";
import { Events } from "whatsapp-web.js";

import {
    handlePing,
    handleBot,
    handleChecagem,
    handleFala,
    handleImagem,
    handleRankingImage,
    handleRanking,
    handleTranscrever,
    handleMenu,
    handleSticker
} from "../events";

import { MessageObserver } from "../observers/message";
import { shouldProcessMessage } from "../helpers/messageFilter";

const observer = new MessageObserver();

observer.addListener("!menu", handleMenu);
observer.addListener('!ping', handlePing);
observer.addListener("!bot", handleBot);
observer.addListener("!checagem", handleChecagem);
observer.addListener("!fala", handleFala);
observer.addListener("!imagem", handleImagem);
observer.addListener("!ranking-imagem", handleRankingImage);
observer.addListener("!ranking", handleRanking);
observer.addListener("!transcrever", handleTranscrever);
observer.addListener("!sticker", handleSticker);
observer.addListener("!menu", handleMenu);

wwebClient.on(Events.MESSAGE_CREATE, async msg => {

    if (!shouldProcessMessage(msg)) {
        return;
    }

    const messageBody = msg.body.toLowerCase();

    const event = messageBody.split(' ')[0];
    observer.notify(event, msg)

});
