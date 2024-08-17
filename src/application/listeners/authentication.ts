import * as qrcode from 'qrcode-terminal';
import { IListener } from '../contracts/IListener';
import { inject, injectable } from 'inversify';
import { Events, type Client as WwebClient } from 'whatsapp-web.js';
import { TYPES } from '../../ioc/types';
import { Logger } from 'winston';

@injectable()
class AuthenticationListener implements IListener {
    @inject(TYPES.WwebClient) wwebClient: WwebClient;
    @inject(TYPES.Logger) logger: Logger;

    public async initialize() {
        this.wwebClient.on(Events.QR_RECEIVED, (qr) => {
            this.logger.info('QR RECEIVED');
            qrcode.generate(qr, { small: true });
        });

        this.wwebClient.on(Events.AUTHENTICATED, async () => {
            this.logger.info('AUTHENTICATED ON WHATSAPP');
        });

        this.wwebClient.on(Events.AUTHENTICATION_FAILURE, (msg) => {
            this.logger.error('AUTHENTICATION FAILURE', msg);
        });

        this.wwebClient.on(Events.READY, () => {
            this.logger.info('READY');
        });
    }
}

export { AuthenticationListener };
