import * as qrcode from 'qrcode-terminal';
import { IListener } from '../contracts/IListener';
import { inject, injectable } from 'inversify';
import { Events, type Client as WwebClient } from 'whatsapp-web.js';
import { TYPES } from '../../ioc/types';

@injectable()
class AuthenticationListener implements IListener {
    @inject(TYPES.WwebClient) wwebClient: WwebClient;

    public async initialize() {
        this.wwebClient.on(Events.QR_RECEIVED, (qr) => {
            console.log('QR RECEIVED', qr);
            qrcode.generate(qr, { small: true });
        });

        this.wwebClient.on(Events.AUTHENTICATED, async () => {
            console.log('AUTHENTICATED ON WHATSAPP');
        });

        this.wwebClient.on(Events.AUTHENTICATION_FAILURE, (msg) => {
            console.error('AUTHENTICATION FAILURE', msg);
        });

        this.wwebClient.on(Events.READY, () => {
            console.log('READY');
        });
    }
}

export { AuthenticationListener };
