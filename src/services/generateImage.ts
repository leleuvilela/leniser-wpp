import { openaiClient } from "../lib/openai"

const generateImage = async (prompt: string) => {
    const image = await openaiClient.images.generate({
        model: 'dall-e-3',
        response_format: 'b64_json',
        quality: 'standard',
        size: '1024x1024',
        n: 1,
        prompt,
    })

    return image;
}

export { generateImage };
