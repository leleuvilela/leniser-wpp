import 'dotenv/config';
import axios, { AxiosInstance } from 'axios';
import { IImgflipService } from '../../application/contracts/IImgflipService';
import { inject, injectable } from 'inversify';
import {
    Meme,
    ImgflipResponse,
    SearchMemesData,
    AiMemeData,
} from '../../application/dtos/imgFlipDto';
import { Logger } from 'winston';
import { TYPES } from '../../ioc/types';

@injectable()
export class ImgflipService implements IImgflipService {
    private baseUrl = 'https://api.imgflip.com';
    private client: AxiosInstance;
    private logger: Logger;

    constructor(@inject(TYPES.Logger) logger: Logger) {
        this.client = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        this.logger = logger;
    }

    async searchMeme(query: string): Promise<Meme | undefined> {
        try {
            if (!process.env.IMGFLIP_USERNAME || !process.env.IMGFLIP_PASSWORD) {
                throw new Error('Credenciais do Imgflip não configuradas');
            }

            const body = {
                username: process.env.IMGFLIP_USERNAME,
                password: process.env.IMGFLIP_PASSWORD,
                include_nsfw: 1,
                query,
            };

            const response = await this.client.postForm<ImgflipResponse<SearchMemesData>>(
                '/search_memes',
                body
            );
            this.logger.info('Memes fetched');

            const meme = response.data.data?.memes[0];

            if (!meme) {
                throw new Error('Meme não encontrado');
            }

            return meme;
        } catch (error) {
            this.logger.error('Erro ao buscar memes:', error);
        }
    }

    async aiMeme(prefix?: string): Promise<AiMemeData | undefined> {
        try {
            if (!process.env.IMGFLIP_USERNAME || !process.env.IMGFLIP_PASSWORD) {
                throw new Error('Credenciais do Imgflip não configuradas');
            }

            const body = {
                username: process.env.IMGFLIP_USERNAME,
                password: process.env.IMGFLIP_PASSWORD,
                model: 'openai',
                prefix_text: prefix,
            };

            const response = await this.client.postForm<ImgflipResponse<AiMemeData>>(
                '/ai_meme',
                body
            );
            this.logger.info('Memes fetched');

            if (!response.data.success) {
                throw new Error(JSON.stringify(response.data));
            }

            return response.data.data;
        } catch (error) {
            this.logger.error('Erro ao buscar memes:', error);
        }
    }
}
