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
    handleMp3
} from "../events";
import { MessageObserver } from "../observers/messageObserver";
import { IMessageRepository } from "../contracts/IMessagesRepository";
import { IMembersRepository } from "../contracts/INumberPermissionsRepository";
import { MemberPermission, Member } from "../dtos/members";
import { IConfigsRepository } from "../contracts/IConfigsRepository";
import { IHandler, IStartWithHandler } from "../contracts/IHandler";

@injectable()
export class MessageCreateListener implements IListener {
    messageObserver: MessageObserver;
    wwebClient: WwebClient;
    messageRepository: IMessageRepository;
    membersRepository: IMembersRepository;
    botHandler: IStartWithHandler;
    falaHandler: IStartWithHandler;
    rankingHandler: IStartWithHandler;
    transcreverHandler: IStartWithHandler;
    configsRepository: IConfigsRepository;
    deuitaHandler: IHandler;
    gilsoHandler: IHandler;

    constructor(
        @inject(TYPES.WwebClient) wwebClient: Client,
        @inject(TYPES.MessageRepository) messageRepository: IMessageRepository,
        @inject(TYPES.MembersRepository) numberPermissionsRepository: IMembersRepository,
        @inject(TYPES.BotHandler) botHandler: IStartWithHandler,
        @inject(TYPES.FalaHandler) falaHandler: IStartWithHandler,
        @inject(TYPES.RankingHandler) rankingHandler: IStartWithHandler,
        @inject(TYPES.TranscreverHandler) transcreverHandler: IStartWithHandler,
        @inject(TYPES.ConfigsRepository) configsRepository: IConfigsRepository,
        @inject(TYPES.DeuitaHandler) deuitaHandler: IHandler,
        @inject(TYPES.GilsoHandler) gilsoHandler: IHandler,
    ) {
        this.messageObserver = new MessageObserver();

        this.wwebClient = wwebClient;
        this.botHandler = botHandler;
        this.falaHandler = falaHandler;
        this.rankingHandler = rankingHandler;
        this.messageRepository = messageRepository;
        this.membersRepository = numberPermissionsRepository;
        this.transcreverHandler = transcreverHandler;
        this.configsRepository = configsRepository;
        this.deuitaHandler = deuitaHandler
        this.gilsoHandler = gilsoHandler;

        this.startListeners();
    }

    private startListeners(): void {
        this.messageObserver.addStartWithMessageHandler("!menu", handleMenu);
        this.messageObserver.addStartWithMessageHandler("!aa", handleAA);
        this.messageObserver.addStartWithMessageHandler("!checagem", handleChecagem);
        this.messageObserver.addStartWithMessageHandler("!ping", handlePing);
        this.messageObserver.addStartWithMessageHandler("!sticker", handleSticker);
        this.messageObserver.addStartWithMessageHandler("!imagem", handleImagem);
        this.messageObserver.addStartWithMessageHandler("!mp3", handleMp3);
        this.messageObserver.addStartWithHandler(this.transcreverHandler);
        this.messageObserver.addStartWithHandler(this.botHandler);
        this.messageObserver.addStartWithHandler(this.falaHandler);
        this.messageObserver.addStartWithHandler(this.rankingHandler);
        this.messageObserver.addHandler(this.deuitaHandler)
        this.messageObserver.addHandler(this.gilsoHandler)
    }

    public async initialize() {
        this.wwebClient.on('message_create', this.handleMessage.bind(this));
    }

    async handleMessage(msg: Message) {
        const member = await this.getMember(msg.from, msg.to);

        if (!member) {
            return;
        }

        await this.saveMessageToMongo(msg, member);

        if (!(await this.shouldProcessMessage(msg, member))) {
            return;
        }

        this.messageObserver.notify(msg, member);
    }

    private async getMember(msgFrom: string, msgTo: string): Promise<Member | null> {
        // local should only consider msg.from
        if (process.env.ENVIRONMENT === 'local') {
            return await this.membersRepository.find(msgFrom)
        }

        return await this.membersRepository.find(msgFrom)
            ?? await this.membersRepository.find(msgTo);
    }

    private async saveMessageToMongo(msg: Message, member: Member | null): Promise<void> {
        const { botNumber } = await this.configsRepository.getDefaultConfigs();

        if (msg.from === botNumber) {
            return
        }

        if (!member?.permissions.includes(MemberPermission.SAVE_MESSAGE)) {
            return;
        }

        try {
            await this.messageRepository.addMessage(msg);
        } catch {
            console.log("MONGO: error to add message to collections in mongo");
        }
    }

    private async shouldProcessMessage(msg: Message, member: Member | null): Promise<boolean> {
        const { botNumber } = await this.configsRepository.getDefaultConfigs();

        if (!member) {
            return false;
        }

        // UTC timestamp in seconds
        const now = Math.floor(new Date().getTime() / 1000);
        const messageTime = new Date(msg.timestamp).getTime();

        if (now - messageTime > 20) {
            return false;
        }

        return msg.from !== botNumber && member.permissions.includes(MemberPermission.MESSAGE_CREATE)
    }
}
