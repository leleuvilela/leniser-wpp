import { Message, Client } from "whatsapp-web.js";
import { Listener } from "./listener";

import {
    handleMenu,
    handlePing,
    handleChecagem,
    handleSticker,
} from "../events";

import { MessageObserver } from "../observers/messageObserver";
import { MessageRepository } from "../../infrastructure/repositories/messagesRepository";
import { FalaHandler } from "../events/fala";
import { RankingHandler } from "../events/ranking";
import { BotHandler } from "../events/bot";

//TODO: REMOVE THIS SHIT
const idGrupoLenise = "556285359995-1486844624@g.us";
const idGrupoLeniseGames = '556299031117-1523720875@g.us';
const idGrupoTeste = '120363311991674552@g.us';

const allowedNumbersToProcessMessages = [
    idGrupoLenise,
    idGrupoLeniseGames,
    idGrupoTeste,
];

export class MessageCreateListener extends Listener {
    messageObserver: MessageObserver;
    messageRepository: MessageRepository;

    botHandler: BotHandler;
    falaHandler: FalaHandler;
    rankingHandler: RankingHandler;

    public static inject = [
        'wwebClient',
        'messageRepository',
        'botHandler',
        'falaHandler',
        'rankingHandler',
    ] as const;

    constructor(
        wwebClient: Client,
        messageRepository: MessageRepository,
        botHandler: BotHandler,
        falaHandler: FalaHandler,
        rankingHandler: RankingHandler,
    ) {
        super(wwebClient)

        this.messageObserver = new MessageObserver();

        this.botHandler = botHandler;
        this.falaHandler = falaHandler;
        this.rankingHandler = rankingHandler;

        this.messageRepository = messageRepository;

        this.startListeners();
    }

    async handleMessage(msg: Message) {
        if (!this.shouldProcessMessage(msg)) {
            return;
        }

        this.messageObserver.notify(msg);

        const messageBody = msg.body.toLowerCase();
        if (messageBody.includes('deuita')) {
            msg.reply('🤖 vai toma no cu');
        }

        await this.saveMessageToMongo(msg);
    }

    private startListeners(): void {
        this.messageObserver.addStartWithMessageHandler("!menu", handleMenu);
        this.messageObserver.addStartWithMessageHandler("!aa", handleMenu);
        this.messageObserver.addStartWithMessageHandler("!checagem", handleChecagem);
        this.messageObserver.addStartWithMessageHandler("!ping", handlePing);
        this.messageObserver.addStartWithMessageHandler("!sticker", handleSticker);

        this.messageObserver.addStartWithHandler(this.botHandler);
        this.messageObserver.addStartWithHandler(this.falaHandler);
        this.messageObserver.addStartWithHandler(this.rankingHandler);
    }

    private async saveMessageToMongo(msg: Message): Promise<void> {
        //TODO: get ids from mongo and check if the message is from a valid group

        if (msg.from !== idGrupoLenise ||
            msg.body.startsWith('🤖')
        ) {
            return;
        }

        try {
            await this.messageRepository.addMessage(msg);
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
