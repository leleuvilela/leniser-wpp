import { Message, Client, Events } from 'whatsapp-web.js';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../ioc/types';
import { IListener } from '../contracts/IListener';
import { type Client as WwebClient } from 'whatsapp-web.js';
import { MessageObserver } from '../observers/messageObserver';
import { IHandler } from '../contracts/IHandler';
import { Logger } from 'winston';

@injectable()
export class MessageCreateListener implements IListener {
    messageObserver: MessageObserver;
    wwebClient: WwebClient;
    logger: Logger;
    pingHandler: IHandler;
    notificarHandler: IHandler;
    contatosHandler: IHandler;

    constructor(
        @inject(TYPES.WwebClient) wwebClient: Client,
        @inject(TYPES.Logger) logger: Logger,
        @inject(TYPES.PingHandler) pingHandler: IHandler,
        @inject(TYPES.NotificarHandler) notificarHandler: IHandler,
        @inject(TYPES.ContatosHandler) contatosHandler: IHandler
    ) {
        this.messageObserver = new MessageObserver();

        this.logger = logger;
        this.wwebClient = wwebClient;
        this.pingHandler = pingHandler;
        this.notificarHandler = notificarHandler;
        this.contatosHandler = contatosHandler;

        this.startListeners();
    }

    private startListeners(): void {
        this.messageObserver.addHandler(this.pingHandler);
        this.messageObserver.addHandler(this.notificarHandler);
        this.messageObserver.addHandler(this.contatosHandler);
    }

    public async initialize() {
        this.wwebClient.on(Events.MESSAGE_CREATE, this.handleMessage.bind(this));
        this.logger.info('MessageCreate initialized');
    }

    private async handleMessage(msg: Message) {
        if (!this.shouldProcessMessage(msg)) {
            return;
        }

        this.messageObserver.notify(msg);
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

        // only process messages from yourself
        return msg.fromMe;
    }
}
