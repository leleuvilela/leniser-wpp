import { mongoClient } from "../clients/mongo";
import { wwebClient } from "../clients/wweb";
import { Events, Message } from "whatsapp-web.js";
import { MessageObserver } from "../observers/message";
import { shouldProcessMessage, idPedroGilso, idGrupoLenise } from "../helpers/messageFilter";
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
    handleSticker,
    handleAA
} from "../events";


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
observer.addListener("!aa", handleAA);

wwebClient.on(Events.MESSAGE_CREATE, async msg => {

    if (!shouldProcessMessage(msg)) {
        return;
    }

    const messageBody = msg.body.toLowerCase();

    const event = messageBody.split(' ')[0];
    observer.notify(event, msg)

    if (msg.author === idPedroGilso && Math.random() < 0.15) {
        msg.reply('🤖 cala a boca seu corrupto')
    }

    if (messageBody.includes('deuita')) {
        msg.reply('🤖 vai toma no cu')
    }

    await saveMessageToMongo(msg);
});

async function saveMessageToMongo(msg: Message) {

    if (!mongoClient || msg.from !== idGrupoLenise || msg.body.startsWith('🤖')) {
        return;
    }

    try {
        await mongoClient.db("rap").collection("messages").insertOne(msg)
    } catch {
        console.log("MONGO: error to add message to collections in mongo")
    }
}
