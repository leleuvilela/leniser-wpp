import { Events, type Message } from "whatsapp-web.js";
import { Listener } from "./listener";
import {
    handleMenu,
    handlePing,
    handleBot,
    handleChecagem,
    handleFala,
    handleImagem,
    handleRankingImage,
    handleRanking,
    handleTranscrever,
    handleSticker,
    handleAA
} from "../events";

//TODO: REMOVE THIS SHIT
const idGrupoLenise = "556285359995-1486844624@g.us";
const idGrupoLeniseGames = '556299031117-1523720875@g.us';
const idGrupoTeste = '120363311991674552@g.us';

const allowedNumbersToProcessMessages = [
    idGrupoLenise,
    idGrupoLeniseGames,
    idGrupoTeste,
];

class MessageCreateListener extends Listener {
    public async initialize() {
        this.wwebClient.on(Events.MESSAGE_CREATE, async msg => {

            if (!this.shouldProcessMessage(msg)) {
                return;
            }

            const messageBody = msg.body.toLowerCase();

            const event = messageBody.split(' ')[0];
            this.messageObserver.notify(event, msg);

            if (messageBody.includes('deuita')) {
                msg.reply('🤖 vai toma no cu');
            }

            await this.saveMessageToMongo(msg);
        });
    }

    public startListeners(): void {
        this.messageObserver.addListener("!menu", handleMenu);
        this.messageObserver.addListener('!ping', handlePing);
        this.messageObserver.addListener("!bot", handleBot);
        this.messageObserver.addListener("!checagem", handleChecagem);
        this.messageObserver.addListener("!fala", handleFala);
        this.messageObserver.addListener("!imagem", handleImagem);
        this.messageObserver.addListener("!ranking-imagem", handleRankingImage);
        this.messageObserver.addListener("!ranking", handleRanking);
        this.messageObserver.addListener("!transcrever", handleTranscrever);
        this.messageObserver.addListener("!sticker", handleSticker);
        this.messageObserver.addListener("!aa", handleAA);
    }

    private async saveMessageToMongo(msg: Message): Promise<void> {
        //TODO: get ids from mongo and check if the message is from a valid group
        if (
            !this.mongoClient ||
            msg.from !== idGrupoLenise ||
            msg.body.startsWith('🤖')
        ) {
            return;
        }

        try {
            await this.mongoClient.db("rap").collection("messages").insertOne(msg);
        } catch {
            console.log("MONGO: error to add message to collections in mongo");
        }
    }

    private shouldProcessMessage(msg: Message): boolean {
        //TODO: get ids from mongo and check if the message is from a valid group
        if (allowedNumbersToProcessMessages.includes(msg.from) || allowedNumbersToProcessMessages.includes(msg.to)) {
            return true;
        }

        return false;
    }
}

export { MessageCreateListener };
