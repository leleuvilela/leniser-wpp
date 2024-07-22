import * as qrcode from 'qrcode-terminal';
import { IListener } from '../contracts/IListener';
import { inject, injectable } from 'inversify';
import { type Client as WwebClient } from "whatsapp-web.js";
import { TYPES } from '../../ioc/types';

@injectable()
class AuthenticationListener implements IListener {
    @inject(TYPES.WwebClient) wwebClient: WwebClient

    public async initialize() {
        this.wwebClient.on('qr', (qr) => {
            console.log('QR RECEIVED', qr);
            qrcode.generate(qr, { small: true });
        });


        this.wwebClient.on('authenticated', async () => {
            console.log('AUTHENTICATED ON WHATSAPP');
        });


        this.wwebClient.on('auth_failure', msg => {
            console.error('AUTHENTICATION FAILURE', msg);
        });

        this.wwebClient.on('ready', () => {
            console.log('READY');
        });

    }
}

export { AuthenticationListener };
