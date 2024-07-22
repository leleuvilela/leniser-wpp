import { Message, Client } from "whatsapp-web.js";
import { IListener } from "../contracts/IListener";
import { type Client as WwebClient } from "whatsapp-web.js";

import {
    handleMenu,
    handlePing,
    handleChecagem,
    handleSticker,
    handleAA,
    handleImagem,
} from "../events";

import { MessageObserver } from "../observers/messageObserver";
import { MessageRepository } from "../../infrastructure/repositories/messagesRepository";
import { FalaHandler } from "../events/fala";
import { RankingHandler } from "../events/ranking";
import { BotHandler } from "../events/bot";
import { inject, injectable } from "inversify";
import { TYPES } from '../../ioc/types';
import { AllowedNumbersRepository } from "../../infrastructure/repositories/allowedNumbersRepository";

//TODO: REMOVE THIS SHIT
const idGrupoLenise = "556285359995-1486844624@g.us";

@injectable()
export class MessageCreateListener implements IListener {
    messageObserver: MessageObserver;
    wwebClient: WwebClient;
    messageRepository: MessageRepository;
    allowedNumbersRepository: AllowedNumbersRepository;
    botHandler: BotHandler;
    falaHandler: FalaHandler;
    rankingHandler: RankingHandler;

    constructor(
        @inject(TYPES.WwebClient) wwebClient: Client,
        @inject(TYPES.MessageRepository) messageRepository: MessageRepository,
        @inject(TYPES.AllowedNumbersRepository) allowedNumbersRepository: AllowedNumbersRepository,
        @inject(TYPES.BotHandler) botHandler: BotHandler,
        @inject(TYPES.FalaHandler) falaHandler: FalaHandler,
        @inject(TYPES.RankingHandler) rankingHandler: RankingHandler,
    ) {
        this.messageObserver = new MessageObserver();

        this.wwebClient = wwebClient;
        this.botHandler = botHandler;
        this.falaHandler = falaHandler;
        this.rankingHandler = rankingHandler;
        this.messageRepository = messageRepository;
        this.allowedNumbersRepository = allowedNumbersRepository;

        this.allowedNumbersRepository.getAllowedNumbers();
        this.startListeners();
    }

    public async initialize() {
        this.wwebClient.on('message_create', this.handleMessage.bind(this));
    }

    async handleMessage(msg: Message) {
        if (!this.allowedNumbersRepository.isAllowed(msg.from)) {
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
        this.messageObserver.addStartWithMessageHandler("!aa", handleAA);
        this.messageObserver.addStartWithMessageHandler("!checagem", handleChecagem);
        this.messageObserver.addStartWithMessageHandler("!ping", handlePing);
        this.messageObserver.addStartWithMessageHandler("!sticker", handleSticker);
        this.messageObserver.addStartWithMessageHandler("!imagem", handleImagem);

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
}
