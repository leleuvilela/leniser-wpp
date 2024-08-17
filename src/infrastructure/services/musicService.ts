import { inject, injectable } from 'inversify';
import { IMusicService } from '../../application/contracts/IMusicService';
import axios, { AxiosInstance } from 'axios';
import { MusicResponse } from '../../application/dtos/musicDto';
import { Logger } from 'winston';
import { TYPES } from '../../ioc/types';

@injectable()
export class MusicService implements IMusicService {
    private baseUrl = 'https://sunoapi-eight.vercel.app';
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

    async generate(prompt: string): Promise<MusicResponse[] | undefined> {
        try {
            const response = await this.client.post('/api/generate', {
                wait_audio: true,
                make_instrumental: false,
                prompt,
            });

            if (response.status !== 200) {
                this.logger.error(
                    `Error in generate music: ${response.status} - ${response.statusText}`
                );
                return;
            }

            this.logger.info('Music generated');

            return response.data;
        } catch (error) {
            this.logger.error('Error in generate music:', error);
        }
    }
}
