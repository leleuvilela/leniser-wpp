import { Meme, AiMemeData } from '../dtos/imgFlipDto';

export interface IImgflipService {
    searchMeme(query: string): Promise<Meme | undefined>;
    aiMeme(prefix?: string): Promise<AiMemeData | undefined>;
}
