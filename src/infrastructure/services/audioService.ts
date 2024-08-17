import OpenAI from 'openai';
import { IAudioService } from '../../application/contracts/IAudioService';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../ioc/types';
import { Logger } from 'winston';

@injectable()
export class AudioService implements IAudioService {
    @inject(TYPES.OpenAIClient) openAIClient: OpenAI;
    @inject(TYPES.Logger) logger: Logger;

    async generateAudio(text: string): Promise<Buffer> {
        const mp3 = await this.openAIClient.audio.speech.create({
            model: 'tts-1',
            voice: 'onyx',
            input: text,
        });
        this.logger.info('Audio generated');

        const buffer = Buffer.from(await mp3.arrayBuffer());
        return buffer;
    }
}
