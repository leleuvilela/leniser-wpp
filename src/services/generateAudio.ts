import { openaiClient } from "../lib/openai";

const generateAudio = async (text: string) => {
    const mp3 = await openaiClient.audio.speech.create({
        model: "tts-1",
        voice: "onyx",
        input: text
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    return buffer;
};

export { generateAudio };
