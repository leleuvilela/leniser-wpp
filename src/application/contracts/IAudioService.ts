export interface IAudioService {
    generateAudio: (text: string) => Promise<Buffer>;
}
