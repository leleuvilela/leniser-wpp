import { wwebClient } from "../clients/wweb";
import { handlePing, handleBot, handleChecagem, handleFala, handleImagem, handleRanking } from "../events";
import { MessageObserver } from "../observers/message";

const observer = new MessageObserver();

observer.addListener('!ping', handlePing)
observer.addListener("!bot", handleBot);
observer.addListener("!checagem", handleChecagem);
observer.addListener("!fala", handleFala);
observer.addListener("!imagem", handleImagem);
observer.addListener("!ranking", handleRanking);

wwebClient.on("message_create", msg => {

    const messageBody = msg.body.toLowerCase();

    const event = messageBody.split(' ')[0];
    observer.notify(event, msg)

});
