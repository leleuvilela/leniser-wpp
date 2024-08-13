import { injectable } from 'inversify';
import { IMusicService } from '../../application/contracts/IMusicService';
import axios, { AxiosInstance } from 'axios';
import { MusicResponse } from '../../application/dtos/musicDto';

@injectable()
export class MusicService implements IMusicService {
    private baseUrl = 'https://sunoapi-eight.vercel.app';
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    async generate(prompt: string): Promise<MusicResponse[] | undefined> {
        try {
            const response = await this.client.post('/api/generate', {
                wait_audio: true,
                make_instrumental: false,
                prompt,
            });

            if (response.status !== 200) {
                console.error(
                    `Erro ao gerar musica: ${response.status} - ${response.statusText}`
                );
                return;
            }

            return response.data;
        } catch (error) {
            console.error(error);
        }
    }
}
