import { Message, MessageMedia } from "whatsapp-web.js";
import { createMask } from "../utils/createMask";
import { resizeImage } from "../utils/resizeImage";
import { createCooldownFunction } from "../helpers/createCooldown";
import { editImage } from "../helpers/editImage";
import { toFile } from "openai";

const editImageCd = createCooldownFunction(editImage, 120);

async function handleEditImage(msg: Message) {

  const commandArray = msg.body.split(' ');

  commandArray.shift();
  const prompt = commandArray.join(' ');

  if (!msg.hasQuotedMsg) {

    msg.reply('🤖 Manda uma imagem pra eu editar, por favor.');
    return;
  }
  // const imageToMask = await msg.downloadMedia();
  const quotedMsg = await msg.getQuotedMessage();
  if (quotedMsg.hasMedia && quotedMsg.type === 'image') {
    // const imageToMaskBuffer = Buffer.from(imageToMask.data, 'base64');
    // const { x, y, width, height } = await determineAreaOfInterest(imageToMaskBuffer);

    const originalImage = await quotedMsg.downloadMedia();

    const originalImageResized = await resizeImage(originalImage.data, 4);
    const mask = await createMask(originalImageResized);

    const originalImageUploadable = await toFile(originalImageResized);
    const maskUploadable = await toFile(mask);

    const imageRes = await editImageCd(prompt, originalImageUploadable, maskUploadable);

    if (!imageRes) {
      msg.reply('🤖 Pera aí, tá em cooldown...');
      return;
    }

    const imageBase64 = imageRes.data[0]?.b64_json;
    msg.reply(new MessageMedia('image/jpeg', imageBase64));
  }
}

export { handleEditImage }