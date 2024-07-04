import WAWebJS from "whatsapp-web.js";
import { mongoClient } from "../clients/mongo";
import { wwebClient } from "../clients/wweb";
import { handlePing, handleBot, handleChecagem, handleFala, handleImagem, handleRanking, handleTranscrever } from "../events";
import { MessageObserver } from "../observers/message";

const idGrupoLenise = '556285359995-1486844624@g.us'
const idGrupoLeniseGames = '556299031117-1523720875@g.us'
const idGrupoTeste = '120363311991674552@g.us';
const idPedroGilso = '556283282310@c.us';

const observer = new MessageObserver();

observer.addListener('!ping', handlePing)
observer.addListener("!bot", handleBot);
observer.addListener("!checagem", handleChecagem);
observer.addListener("!fala", handleFala);
observer.addListener("!imagem", handleImagem);
observer.addListener("!ranking", handleRanking);
observer.addListener("!transcrever", handleTranscrever)

wwebClient.on("message_create", async msg => {

    if (!shouldProcessMessage(msg)) {
        return;
    }

    const messageBody = msg.body.toLowerCase();

    const event = messageBody.split(' ')[0];
    observer.notify(event, msg)

});

function shouldIgnoreMessage(msg: any): boolean {
    return (
        msg.from !== idGrupoLenise &&
        msg.from !== idGrupoLeniseGames &&
        msg.from !== idGrupoTeste) || (
        msg.to !== idGrupoLenise &&
        msg.to !== idGrupoLeniseGames &&
        msg.to !== idGrupoTeste)
}
