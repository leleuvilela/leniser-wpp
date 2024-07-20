import OpenAI from "openai";
import { IAudioService } from "../../application/contracts/IAudioService";

export class AudioService implements IAudioService {
    openAIClient: OpenAI

    public static inject = ['openAIClient'] as const;
    constructor(openAIClient: OpenAI) {
        this.openAIClient = openAIClient;
    }

    async generateAudio(text: string): Promise<Buffer> {
        const mp3 = await this.openAIClient.audio.speech.create({
            model: "tts-1",
            voice: "onyx",
            input: text
        });

        const buffer = Buffer.from(await mp3.arrayBuffer());
        return buffer;
    }
}
