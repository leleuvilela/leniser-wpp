import { injectable } from 'inversify';
import { IImageService } from '../../application/contracts/IImageService';
import { openaiClient } from '../openai';
import { ImagesResponse } from 'openai/resources';

@injectable()
export class ImageService implements IImageService {
    public async generateImage(prompt: string): Promise<ImagesResponse> {
        const image = await openaiClient.images.generate({
            model: 'dall-e-3',
            response_format: 'b64_json',
            quality: 'standard',
            size: '1024x1024',
            n: 1,
            prompt,
        });

        return image;
    }
}
