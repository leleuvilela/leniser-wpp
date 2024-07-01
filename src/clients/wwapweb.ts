import { Client, LocalAuth, Poll } from 'whatsapp-web.js';

const wwebVersion = '2.2412.54';

const wwapwebClient = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true, // false to show the browser.
        args: ['--no-sandbox']
    },
    webVersionCache: {
        type: 'remote',
        remotePath: `https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/${wwebVersion}.html`,
    },
});

export { wwapwebClient };
