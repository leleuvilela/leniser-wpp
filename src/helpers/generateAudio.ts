import { openaiClient } from "../clients/openai";

const generateAudio = async (text: string) => {
    const mp3 = await openaiClient.audio.speech.create({
        model: "tts-1",
        voice: "alloy",
        input: text
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    return buffer;
}

export { generateAudio };
