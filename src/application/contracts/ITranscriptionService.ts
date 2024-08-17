export interface ITranscriptionService {
    generateTranscription: (audioBuffer: Buffer) => Promise<string>;
}
