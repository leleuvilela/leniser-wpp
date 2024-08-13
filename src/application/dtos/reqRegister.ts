export interface ReqRegister {
    timestamp: Date;
    author?: string;
    memberId: string;
    type: string;
}

export enum ReqRegisterType {
    IMAGE = 'image',
    TEXT = 'text',
    AUDIO = 'audio',
    MUSIC = 'music',
    MEME = 'meme',
    TRANSCRIPTION = 'transcription',
}
