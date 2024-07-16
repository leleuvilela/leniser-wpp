import { mongoClient } from "../clients/mongo";
import { wwebClient } from "../clients/wweb";
import * as qrcode from 'qrcode-terminal';

wwebClient.on('qr', (qr) => {
    // NOTE: This event will not be fired if a session is specified.
    console.log('QR RECEIVED', qr);
    qrcode.generate(qr, { small: true });
});


wwebClient.on('authenticated', async () => {
    console.log('AUTHENTICATED ON WHATSAPP');

    const uri = process.env.DB_URI;

    if (!uri){
        console.log('DB URI NOT FOUND');
        return;
    }

    await mongoClient.connect();
    await mongoClient.db("lenise").command({ ping: 1 });

    console.log('DB CONNECTED');
});


wwebClient.on('auth_failure', msg => {
    // Fired if session restore was unsuccessful
    console.error('AUTHENTICATION FAILURE', msg);
});

wwebClient.on('ready', () => {
    console.log('READY');
});

