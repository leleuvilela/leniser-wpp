import { Message, MessageMedia } from "whatsapp-web.js";
import { createCooldownFunction } from "../utils/createCooldown";
import { generateImage } from "../services/generateImage";

const disableCooldown = process.env.IMAGE_COOLDOWN_DISABLED === 'true';

if (disableCooldown) {
    console.log('🤖 Cooldown de imagem desabilitado');
}
else {
    console.log('🤖 Cooldown de imagem habilitado');
}

const cooldownSeconds = process.env.IMAGE_COOLDOWN_SECONDS
    ? parseInt(process.env.IMAGE_COOLDOWN_SECONDS)
    : 120;

const generateImageCd = createCooldownFunction(generateImage, cooldownSeconds);

async function handleImagem(msg: Message) {
    const textArray = msg.body.split(' ');
    textArray.shift();
    const text = textArray.join(' ');

    try {
        const imageRes = disableCooldown
            ? await generateImage(text)
            : await generateImageCd(text);

        if (!imageRes) {
            msg.reply('🤖 Pera aí, tá em cooldown...');
            return;
        }

        const imageBase64 = imageRes.data[0]?.b64_json;
        msg.reply(new MessageMedia('image/jpeg', imageBase64));
    } catch (error) {
        console.log(error);
        msg.reply('🤖 Calma lá calabreso, isso aí não pode não.');
    }
}

export { handleImagem };
