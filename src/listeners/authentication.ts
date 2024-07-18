import * as qrcode from 'qrcode-terminal';
import { Listener } from './listener';

class AuthenticationListener extends Listener {

    public async initialize() {
        this.wwebClient.on('qr', (qr) => {
            console.log('QR RECEIVED', qr);
            qrcode.generate(qr, { small: true });
        });


        this.wwebClient.on('authenticated', async () => {
            console.log('AUTHENTICATED ON WHATSAPP');

            //TODO: Remove this connection in DB to separate the responsability ----
            const uri = process.env.DB_URI;

            if (!uri) {
                console.log('DB URI NOT FOUND');
                return;
            }

            await this.mongoClient.connect();
            await this.mongoClient.db("lenise").command({ ping: 1 });

            console.log('DB CONNECTED');
            // ------------------------------------------------------------------
        });


        this.wwebClient.on('auth_failure', msg => {
            // Fired if session restore was unsuccessful
            console.error('AUTHENTICATION FAILURE', msg);
        });

        this.wwebClient.on('ready', () => {
            console.log('READY');
        });

    }
}

export { AuthenticationListener };
