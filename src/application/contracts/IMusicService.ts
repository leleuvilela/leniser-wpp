import { MusicResponse } from '../dtos/musicDto';

export interface IMusicService {
    generate(prompt: string): Promise<MusicResponse[] | undefined>;
}
