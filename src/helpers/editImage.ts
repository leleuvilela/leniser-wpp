import { Uploadable } from "openai/uploads";
import { openaiClient } from "../clients/openai"


export const editImage = async (prompt: string, image: Uploadable, mask: Uploadable) => {
  console.log(prompt);
  const editedImage = await openaiClient.images.edit({
    model: 'dall-e-2',
    response_format: 'b64_json',
    image,
    mask,
    size: '1024x1024',
    n: 1,
    prompt,
  })
  return editedImage;
}