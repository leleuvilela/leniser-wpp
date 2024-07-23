export interface ITranscriptionService {
    generateTranscription: (audioBuffer: Buffer, translate?: boolean) => Promise<string>;
}
