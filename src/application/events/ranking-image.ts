import { type Message, MessageMedia } from 'whatsapp-web.js';
import { screenshot } from '../../utils/screenshot';

async function handleRankingImage(msg: Message): Promise<Message> {
    const image = await screenshot(
        'https://charts.mongodb.com/charts-lenise-adlmoim/embed/charts?id=667f1af7-ccaf-437c-876a-c98c6f457ee5&maxDataAge=3600&theme=dark&autoRefresh=true'
    );
    const imageBase64 = Buffer.from(image).toString('base64');
    return msg.reply(new MessageMedia('image/jpeg', imageBase64));
}

export { handleRankingImage };
