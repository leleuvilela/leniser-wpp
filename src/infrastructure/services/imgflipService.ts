import 'dotenv/config';
import axios, { AxiosInstance } from 'axios';
import { IImgflipService } from '../../application/contracts/IImgflipService';
import { injectable } from 'inversify';
import {
    Meme,
    ImgflipResponse,
    SearchMemesData,
    AiMemeData,
} from '../../application/dtos/imgFlipDto';

@injectable()
export class ImgflipService implements IImgflipService {
    private baseUrl = 'https://api.imgflip.com';
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'Content-Type': 'application/json',
            },
        });
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

            const meme = response.data.data?.memes[0];

            if (!meme) {
                throw new Error('Meme não encontrado');
            }

            return meme;
        } catch (error) {
            console.error('Erro ao buscar memes:', error);
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

            if (!response.data.success) {
                throw new Error(JSON.stringify(response.data));
            }

            return response.data.data;
        } catch (error) {
            console.error('Erro ao buscar memes:', error);
        }
    }
}
