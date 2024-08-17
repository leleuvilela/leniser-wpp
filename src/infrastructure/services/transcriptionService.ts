import { toFile } from 'openai/uploads';
import { ITranscriptionService } from '../../application/contracts/ITranscriptionService';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../ioc/types';
import OpenAI from 'openai';
import { Logger } from 'winston';

@injectable()
export class TranscriptionService implements ITranscriptionService {
    @inject(TYPES.OpenAIClient) openAIClient: OpenAI;
    @inject(TYPES.Logger) logger: Logger;

    public async generateTranscription(audioBuffer: Buffer) {
        try {
            const audioFile = await toFile(audioBuffer, 'audio.ogg', {
                type: 'audio/ogg',
            });

            const transcription = await this.openAIClient.audio.transcriptions.create({
                model: 'whisper-1',
                file: audioFile,
            });
            this.logger.info('Transcription generated');

            return transcription.text;
        } catch (error) {
            this.logger.error('Error on generateTranscription', error);
            return 'Algo de errado não está certo.';
        }
    }
}
