import { type OpenAI } from 'openai';
import { IResponseService } from '../../application/contracts/IResponseService';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../ioc/types';
import { Logger } from 'winston';
import { Response, ResponseInput } from 'openai/resources/responses/responses';

@injectable()
export class ResponseService implements IResponseService {
    @inject(TYPES.OpenAIClient) openAIClient: OpenAI;
    @inject(TYPES.Logger) logger: Logger;

    private readonly MAX_POLL_ATTEMPTS = 10;
    private readonly POLL_INTERVAL_MS = 5000;

    async generateResponse(
        systemRoleMessage: string,
        prompts: string | ResponseInput
    ): Promise<string> {
        try {
            let response: Response = await this.openAIClient.responses.create({
                model: 'gpt-5',
                instructions: systemRoleMessage,
                input: prompts,
                stream: false,
            });

            response = await this.pollForCompletion(response);

            return this.extractTextFromResponse(response);
        } catch (error) {
            this.logger.error('Error in generateResponse:', error);
            return 'ih carai, deu erro aqui, foi mal.';
        }
    }

    private async pollForCompletion(response: Response): Promise<Response> {
        let attempts = 0;
        const pollableStatuses = ['in_progress', 'queued', 'incomplete'];

        while (
            pollableStatuses.includes(response.status || '') &&
            attempts < this.MAX_POLL_ATTEMPTS
        ) {
            this.logger.info(
                `Response status: ${response.status}, polling attempt ${attempts + 1}/${this.MAX_POLL_ATTEMPTS}`
            );

            await this.delay(this.POLL_INTERVAL_MS);
            response = await this.openAIClient.responses.retrieve(response.id);
            attempts++;
        }

        if (pollableStatuses.includes(response.status || '')) {
            this.logger.warn(
                `Response still ${response.status} after ${this.MAX_POLL_ATTEMPTS} attempts`
            );
        }

        return response;
    }

    private extractTextFromResponse(response: Response): string {
        if (response.status === 'failed') {
            this.logger.error('Response failed:', response.error);
            return 'ih carai, deu erro aqui, foi mal.';
        }

        if (response.status === 'cancelled') {
            this.logger.warn('Response was cancelled');
            return 'ih carai, deu erro aqui, foi mal.';
        }

        if (response.status === 'incomplete') {
            this.logger.warn('Response incomplete:', response.incomplete_details);

            if (response.incomplete_details?.reason === 'max_output_tokens') {
                return 'eita, pensei demais e não sobrou espaço pra responder. tenta de novo aí.';
            }
        }

        if (response.error) {
            this.logger.error('Response error:', response.error);
            return 'ih carai, deu erro aqui, foi mal.';
        }

        if (response.output_text?.trim()) {
            this.logger.info('Response generated successfully');
            return response.output_text.trim();
        }

        for (const item of response.output) {
            if (item.type === 'message') {
                for (const content of item.content) {
                    if (content.type === 'output_text' && content.text?.trim()) {
                        this.logger.info('Response generated from output array');
                        return content.text.trim();
                    }
                    if (content.type === 'refusal') {
                        this.logger.warn('Model refused:', content.refusal);
                        return 'ih carai, deu erro aqui, foi mal.';
                    }
                }
            }
        }

        this.logger.warn(JSON.stringify(response));
        this.logger.warn('Empty response from OpenAI, status:', response.status);
        return 'ih carai, deu erro aqui, foi mal.';
    }

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
