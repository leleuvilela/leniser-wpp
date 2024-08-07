import { MusicResponse } from '../dtos/musicDto';

export interface IMusicService {
    generate(
        prompt: string,
        makeInstrumental: boolean
    ): Promise<MusicResponse[] | undefined>;
}
