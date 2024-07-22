import { toFile } from "openai/uploads";
import { openaiClient } from "../openai";

async function generateTranscription(audioBuffer: Buffer, translate?: boolean) {
    try {
        const audioFile = await toFile(audioBuffer, 'audio.ogg', {
            type: 'audio/ogg'
        });

        if (translate) {
            const transcription = await openaiClient.audio.translations.create({
                model: 'whisper-1',
                file: audioFile,
            });

            return transcription.text;
        }

        const transcription = await openaiClient.audio.transcriptions.create({
            model: 'whisper-1',
            file: audioFile,
        });

        return transcription.text;
    } catch (e) {
        console.log(e);
        return "Algo de errado não está certo.";
    }
}

export { generateTranscription };
