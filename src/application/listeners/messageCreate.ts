import { Message, Client } from "whatsapp-web.js";
import { inject, injectable } from "inversify";
import { TYPES } from '../../ioc/types';
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
import { FalaHandler } from "../events/fala";
import { RankingHandler } from "../events/ranking";
import { BotHandler } from "../events/bot";
import { IMessageRepository } from "../contracts/IMessagesRepository";
import { INumberPermissionRepository } from "../contracts/INumberPermissionsRepository";
import { NumberPermission, NumberPermissions } from "../dtos/numberPermission";

@injectable()
export class MessageCreateListener implements IListener {
    messageObserver: MessageObserver;
    wwebClient: WwebClient;
    messageRepository: IMessageRepository;
    numberPermissionRepository: INumberPermissionRepository;
    botHandler: BotHandler;
    falaHandler: FalaHandler;
    rankingHandler: RankingHandler;

    botNumber = '351931426775@g.us'

    constructor(
        @inject(TYPES.WwebClient) wwebClient: Client,
        @inject(TYPES.MessageRepository) messageRepository: IMessageRepository,
        @inject(TYPES.NumberPermissionRepository) numberPermissionsRepository: INumberPermissionRepository,
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
        this.numberPermissionRepository = numberPermissionsRepository;

        this.startListeners();
    }

    public async initialize() {
        this.wwebClient.on('message_create', this.handleMessage.bind(this));
    }

    async handleMessage(msg: Message) {
        var numberPermissions = await this.numberPermissionRepository.find(msg.from)
            ?? await this.numberPermissionRepository.find(msg.to);

        await this.saveMessageToMongo(msg, numberPermissions);

        if (!this.shouldProcessMessage(msg, numberPermissions)) {
            return;
        }

        this.messageObserver.notify(msg);

        const messageBody = msg.body.toLowerCase();
        if (messageBody.includes('deuita')) {
            msg.reply('🤖 vai toma no cu');
        }
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

    private async saveMessageToMongo(msg: Message, numberPermissions: NumberPermissions | null): Promise<void> {

        if (msg.author === this.botNumber) {
            return
        }

        if (!numberPermissions?.permissions.includes(NumberPermission.SAVE_MESSAGE)) {
            return;
        }

        try {
            await this.messageRepository.addMessage(msg);
        } catch {
            console.log("MONGO: error to add message to collections in mongo");
        }
    }

    private shouldProcessMessage(msg: Message, numberPermissions: NumberPermissions | null): boolean {

        if (!numberPermissions){
            return false;
        }

        // UTC timestamp in seconds
        const now = Math.floor(new Date().getTime() / 1000);
        const messageTime = new Date(msg.timestamp).getTime();

        if (now - messageTime > 20) {
            return false;
        }

        return msg.author !== this.botNumber && numberPermissions.permissions.includes(NumberPermission.MESSAGE_CREATE)
    }

}
