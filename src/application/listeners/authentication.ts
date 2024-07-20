import * as qrcode from 'qrcode-terminal';
import { Listener } from './listener';
import { Client } from 'whatsapp-web.js';

class AuthenticationListener extends Listener {

    public static inject = ['wwebClient'] as const;
    constructor(wwebClient: Client) {
        super(wwebClient);
    }

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
