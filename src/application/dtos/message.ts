export interface IMessage {
    timestampUtc: number;
    timestampBrasil: number;
    timestampBrasilString: string;
    day: string;
    notifyName?: string;
    from: string;
    to: string;
    author: string | null;
    mimetype: string | null;
    quotedParticipant: string | null;
    type: string;
    hasMedia: boolean;
    isForwarded: boolean;
    deviceType: string;
    characterCount: number;
}
