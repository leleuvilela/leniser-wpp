import { toFile } from "openai/uploads";
import { ITranscriptionService } from "../../application/contracts/ITranscriptionService";
import { inject, injectable } from "inversify";
import { TYPES } from "../../ioc/types";
import OpenAI from "openai";

@injectable()
export class TranscriptionService implements ITranscriptionService {
    @inject(TYPES.OpenAIClient) openAIClient: OpenAI

    public async generateTranscription(audioBuffer: Buffer, translate?: boolean) {
        try {
            const audioFile = await toFile(audioBuffer, 'audio.ogg', {
                type: 'audio/ogg'
            });

            if (translate) {
                const transcription = await this.openAIClient.audio.translations.create({
                    model: 'whisper-1',
                    file: audioFile,
                });

                return transcription.text;
            }

            const transcription = await this.openAIClient.audio.transcriptions.create({
                model: 'whisper-1',
                file: audioFile,
            });

            return transcription.text;
        } catch (e) {
            console.log(e);
            return "Algo de errado não está certo.";
        }
    }
};
