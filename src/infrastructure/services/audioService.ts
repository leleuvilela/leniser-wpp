import OpenAI from 'openai';
import { IAudioService } from '../../application/contracts/IAudioService';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../ioc/types';

@injectable()
export class AudioService implements IAudioService {
    @inject(TYPES.OpenAIClient) openAIClient: OpenAI;

    async generateAudio(text: string): Promise<Buffer> {
        const mp3 = await this.openAIClient.audio.speech.create({
            model: 'tts-1',
            voice: 'onyx',
            input: text,
        });

        const buffer = Buffer.from(await mp3.arrayBuffer());
        return buffer;
    }
}
