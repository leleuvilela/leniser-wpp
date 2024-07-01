import { mongoClient } from "../clients/mongo";
import { wwapwebClient } from "../clients/wwapweb";
import * as qrcode from 'qrcode-terminal';

wwapwebClient.on('qr', (qr) => {
    // NOTE: This event will not be fired if a session is specified.
    console.log('QR RECEIVED', qr);
    qrcode.generate(qr, { small: true });
});


wwapwebClient.on('authenticated', async () => {
    console.log('AUTHENTICATED ON WHATSAPP');

    await mongoClient.connect();
    await mongoClient.db("lenise").command({ ping: 1 });
    console.log('DB CONNECTED');
});


wwapwebClient.on('auth_failure', msg => {
    // Fired if session restore was unsuccessful
    console.error('AUTHENTICATION FAILURE', msg);
});

wwapwebClient.on('ready', () => {
    console.log('READY');
});

