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
import { IMessage } from '../dtos/message';
import { toDateOnlyString, toDateTimeString } from '../../utils/dateExtensions';

interface MessageDocument {
    _data: {
        notifyName: string;
        quotedParticipant?: string;
        mimetype?: string;
    };
    from: string;
    to: string;
    type: string;
    timestamp: number;
    author?: string;
    hasMedia: boolean;
    body?: string;
    isForwarded: boolean;
    deviceType: string;
}

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
    mensagensPorDiaHandler: IHandler;
    botHandler: IHandler;
    transcreverHandler: IHandler;
    menuHandler: IHandler;
    aaHandler: IHandler;
    checagemHandler: IHandler;
    vaiNeleHandler: IHandler;
    pingHandler: IHandler;
    stickerHandler: IHandler;
    imagemHandler: IHandler;
    mp3Handler: IHandler;
    aiMemeHandler: IHandler;
    memeHandler: IHandler;
    musicHandler: IHandler;
    resumoHandler: IHandler;

    constructor(
        @inject(TYPES.WwebClient) wwebClient: Client,
        @inject(TYPES.MessageRepository) messageRepository: IMessageRepository,
        @inject(TYPES.MembersRepository) numberPermissionsRepository: IMembersRepository,
        @inject(TYPES.DeuitaHandler) deuitaHandler: IHandler,
        @inject(TYPES.FalaHandler) falaHandler: IHandler,
        @inject(TYPES.RankingHandler) rankingHandler: IHandler,
        @inject(TYPES.MensagensPorDiaHandler) mensagensPorDiaHandler: IHandler,
        @inject(TYPES.BotHandler) botHandler: IHandler,
        @inject(TYPES.TranscreverHandler) transcreverHandler: IHandler,
        @inject(TYPES.GilsoHandler) gilsoHandler: IHandler,
        @inject(TYPES.MenuHandler) menuHandler: IHandler,
        @inject(TYPES.AaHandler) aaHandler: IHandler,
        @inject(TYPES.ChecagemHandler) checagemHandler: IHandler,
        @inject(TYPES.VaiNeleHandler) vaiNeleHandler: IHandler,
        @inject(TYPES.PingHandler) pingHandler: IHandler,
        @inject(TYPES.StickerHandler) stickerHandler: IHandler,
        @inject(TYPES.ImagemHandler) imagemHandler: IHandler,
        @inject(TYPES.Mp3Handler) mp3Handler: IHandler,
        @inject(TYPES.AiMemeHandler) aiMemeHandler: IHandler,
        @inject(TYPES.MemeHandler) memeHandler: IHandler,
        @inject(TYPES.MusicHandler) musicaHandler: IHandler,
        @inject(TYPES.ResumoHandler) resumoHandler: IHandler
    ) {
        this.messageObserver = new MessageObserver();

        this.wwebClient = wwebClient;
        this.botHandler = botHandler;
        this.falaHandler = falaHandler;
        this.rankingHandler = rankingHandler;
        this.mensagensPorDiaHandler = mensagensPorDiaHandler;
        this.messageRepository = messageRepository;
        this.membersRepository = numberPermissionsRepository;
        this.transcreverHandler = transcreverHandler;
        this.deuitaHandler = deuitaHandler;
        this.gilsoHandler = gilsoHandler;
        this.menuHandler = menuHandler;
        this.aaHandler = aaHandler;
        this.checagemHandler = checagemHandler;
        this.vaiNeleHandler = vaiNeleHandler;
        this.pingHandler = pingHandler;
        this.stickerHandler = stickerHandler;
        this.imagemHandler = imagemHandler;
        this.mp3Handler = mp3Handler;
        this.aiMemeHandler = aiMemeHandler;
        this.memeHandler = memeHandler;
        this.musicHandler = musicaHandler;
        this.resumoHandler = resumoHandler;

        this.startListeners();
    }

    private startListeners(): void {
        this.messageObserver.addHandler(this.falaHandler);
        this.messageObserver.addHandler(this.rankingHandler);
        this.messageObserver.addHandler(this.mensagensPorDiaHandler);
        this.messageObserver.addHandler(this.botHandler);
        this.messageObserver.addHandler(this.transcreverHandler);
        this.messageObserver.addHandler(this.aaHandler);
        this.messageObserver.addHandler(this.pingHandler);
        this.messageObserver.addHandler(this.checagemHandler);
        this.messageObserver.addHandler(this.vaiNeleHandler);
        this.messageObserver.addHandler(this.menuHandler);
        this.messageObserver.addHandler(this.stickerHandler);
        this.messageObserver.addHandler(this.imagemHandler);
        this.messageObserver.addHandler(this.mp3Handler);
        this.messageObserver.addHandler(this.deuitaHandler);
        this.messageObserver.addHandler(this.gilsoHandler);
        this.messageObserver.addHandler(this.aiMemeHandler);
        this.messageObserver.addHandler(this.memeHandler);
        this.messageObserver.addHandler(this.musicHandler);
        this.messageObserver.addHandler(this.resumoHandler);
    }

    public async initialize() {
        this.wwebClient.on(Events.MESSAGE_CREATE, this.handleMessage.bind(this));
    }

    private async handleMessage(msg: Message) {
        const memberId = msg.fromMe ? msg.to : msg.from;

        const member = await this.membersRepository.find(memberId);

        await this.saveMessageToMongo(msg, member);

        if (!this.shouldProcessMessage(msg)) {
            return;
        }

        this.messageObserver.notify(msg, member);
    }

    private async saveMessageToMongo(msg: Message, member: Member | null): Promise<void> {
        if (!member) {
            return;
        }

        if (process.env.ENVIRONMENT !== 'local' && msg.fromMe) {
            return;
        }

        if (!member?.permissions.includes(MemberPermission.SAVE_MESSAGE)) {
            return;
        }

        await this.addMessage(msg);
        await this.addFullMessage(msg);
    }

    async addMessage(msg: Message) {
        const msgDocument = msg as unknown as MessageDocument;

        if (!msgDocument) {
            console.error('Error to cast message to MessageDocument!', msg);
            return;
        }

        try {
            const threeHoursInSeconds = 3 * 60 * 60;
            const timestampBrasil = (msg.timestamp - threeHoursInSeconds) * 1000;

            const message: IMessage = {
                timestampUtc: msgDocument.timestamp * 1000,
                timestampBrasil: timestampBrasil,
                timestampBrasilString: toDateTimeString(timestampBrasil, '-03:00'),
                day: toDateOnlyString(timestampBrasil),
                from: msgDocument.from,
                to: msgDocument.to,
                type: msgDocument.type,
                notifyName: msgDocument._data.notifyName,
                author: msgDocument.author || null,
                mimetype: msgDocument._data.mimetype || null,
                quotedParticipant: msgDocument._data.quotedParticipant || null,
                hasMedia: msgDocument.hasMedia,
                isForwarded: msgDocument.isForwarded,
                deviceType: msgDocument.deviceType,
                characterCount: msgDocument.body ? msgDocument.body.length : 0,
            };

            await this.messageRepository.addMessage(message);
        } catch {
            console.log('MONGO: error to add message to collections in mongo');
        }
    }

    async addFullMessage(msg: Message) {
        try {
            await this.messageRepository.addFullMessage(msg);
        } catch (error) {
            console.log('MONGO: error to add FULL message to collections in mongo');
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
