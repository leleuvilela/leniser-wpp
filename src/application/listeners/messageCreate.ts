import { Message, Client, Events } from 'whatsapp-web.js';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../ioc/types';
import { IListener } from '../contracts/IListener';
import { type Client as WwebClient } from 'whatsapp-web.js';
import { MessageObserver } from '../observers/messageObserver';
import { IMessageRepository } from '../contracts/IMessagesRepository';
import { IMembersRepository } from '../contracts/INumberPermissionsRepository';
import { MemberPermission, Member } from '../dtos/members';
import { IHandler } from '../contracts/IHandler';

@injectable()
export class MessageCreateListener implements IListener {
    messageObserver: MessageObserver;
    wwebClient: WwebClient;
    messageRepository: IMessageRepository;
    membersRepository: IMembersRepository;
    deuitaHandler: IHandler;
    gilsoHandler: IHandler;
    falaHandler: IHandler;
    rankingHandler: IHandler;
    botHandler: IHandler;
    transcreverHandler: IHandler;
    menuHandler: IHandler;
    aaHandler: IHandler;
    checagemHandler: IHandler;
    pingHandler: IHandler;
    stickerHandler: IHandler;
    imagemHandler: IHandler;
    mp3Handler: IHandler;
    aiMemeHandler: IHandler;
    memeHandler: IHandler;

    constructor(
        @inject(TYPES.WwebClient) wwebClient: Client,
        @inject(TYPES.MessageRepository) messageRepository: IMessageRepository,
        @inject(TYPES.MembersRepository) numberPermissionsRepository: IMembersRepository,
        @inject(TYPES.DeuitaHandler) deuitaHandler: IHandler,
        @inject(TYPES.FalaHandler) falaHandler: IHandler,
        @inject(TYPES.RankingHandler) rankingHandler: IHandler,
        @inject(TYPES.BotHandler) botHandler: IHandler,
        @inject(TYPES.TranscreverHandler) transcreverHandler: IHandler,
        @inject(TYPES.GilsoHandler) gilsoHandler: IHandler,
        @inject(TYPES.MenuHandler) menuHandler: IHandler,
        @inject(TYPES.AaHandler) aaHandler: IHandler,
        @inject(TYPES.ChecagemHandler) checagemHandler: IHandler,
        @inject(TYPES.PingHandler) pingHandler: IHandler,
        @inject(TYPES.StickerHandler) stickerHandler: IHandler,
        @inject(TYPES.ImagemHandler) imagemHandler: IHandler,
        @inject(TYPES.Mp3Handler) mp3Handler: IHandler,
        @inject(TYPES.AiMemeHandler) aiMemeHandler: IHandler,
        @inject(TYPES.MemeHandler) memeHandler: IHandler
    ) {
        this.messageObserver = new MessageObserver();

        this.wwebClient = wwebClient;
        this.botHandler = botHandler;
        this.falaHandler = falaHandler;
        this.rankingHandler = rankingHandler;
        this.messageRepository = messageRepository;
        this.membersRepository = numberPermissionsRepository;
        this.transcreverHandler = transcreverHandler;
        this.deuitaHandler = deuitaHandler;
        this.gilsoHandler = gilsoHandler;
        this.menuHandler = menuHandler;
        this.aaHandler = aaHandler;
        this.checagemHandler = checagemHandler;
        this.pingHandler = pingHandler;
        this.stickerHandler = stickerHandler;
        this.imagemHandler = imagemHandler;
        this.mp3Handler = mp3Handler;
        this.aiMemeHandler = aiMemeHandler;
        this.memeHandler = memeHandler;

        this.startListeners();
    }

    private startListeners(): void {
        this.messageObserver.addHandler(this.falaHandler);
        this.messageObserver.addHandler(this.rankingHandler);
        this.messageObserver.addHandler(this.botHandler);
        this.messageObserver.addHandler(this.transcreverHandler);
        this.messageObserver.addHandler(this.aaHandler);
        this.messageObserver.addHandler(this.pingHandler);
        this.messageObserver.addHandler(this.checagemHandler);
        this.messageObserver.addHandler(this.menuHandler);
        this.messageObserver.addHandler(this.stickerHandler);
        this.messageObserver.addHandler(this.imagemHandler);
        this.messageObserver.addHandler(this.mp3Handler);
        this.messageObserver.addHandler(this.deuitaHandler);
        this.messageObserver.addHandler(this.gilsoHandler);
        this.messageObserver.addHandler(this.aiMemeHandler);
        this.messageObserver.addHandler(this.memeHandler);
    }

    public async initialize() {
        this.wwebClient.on(Events.MESSAGE_CREATE, this.handleMessage.bind(this));
    }

    private async handleMessage(msg: Message) {
        if (!this.shouldProcessMessage(msg)) {
            return;
        }

        const memberId = msg.fromMe ? msg.to : msg.from;

        const member = await this.membersRepository.find(memberId);

        await this.saveMessageToMongo(msg, member);

        this.messageObserver.notify(msg, member);
    }

    private async saveMessageToMongo(msg: Message, member: Member | null): Promise<void> {
        if (!member) {
            return;
        }

        if (msg.fromMe) {
            return;
        }

        if (!member?.permissions.includes(MemberPermission.SAVE_MESSAGE)) {
            return;
        }

        try {
            await this.messageRepository.addMessage(msg);
        } catch {
            console.log('MONGO: error to add message to collections in mongo');
        }
    }

    private shouldProcessMessage(msg: Message): boolean {
        // UTC timestamp in seconds
        const now = Math.floor(new Date().getTime() / 1000);
        const messageTime = new Date(msg.timestamp).getTime();

        if (now - messageTime > 20) {
            return false;
        }

        if (process.env.ENVIRONMENT === 'local' && msg.fromMe) {
            return true;
        }

        return !msg.fromMe;
    }
}
