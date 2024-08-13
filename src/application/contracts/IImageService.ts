import { ImagesResponse } from 'openai/resources';

export interface IImageService {
    generateImage: (prompt: string) => Promise<ImagesResponse>;
}
