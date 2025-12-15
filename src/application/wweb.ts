import { Client, LocalAuth } from 'whatsapp-web.js';

const wwebClient = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true, // false to show the browser.
        args: ['--no-sandbox'],
    },
});

export { wwebClient };
