import { OpenAI } from 'openai';
import { IResponseService } from '../../application/contracts/IResponseService';
import {
    type ChatCompletionCreateParamsNonStreaming,
    type ChatCompletionContentPart,
} from 'openai/resources';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../ioc/types';
import { Logger } from 'winston';

@injectable()
export class ResponseService implements IResponseService {
    @inject(TYPES.OpenAIClient) openAIClient: OpenAI;
    @inject(TYPES.Logger) logger: Logger;

    async generateResponse(
        systemRoleMessage: string,
        prompts: ChatCompletionContentPart[]
    ): Promise<string> {
        try {
            const req: ChatCompletionCreateParamsNonStreaming = {
                model: 'gpt-5',
                messages: [
                    {
                        role: 'system',
                        content: systemRoleMessage,
                    },
                ],
                max_completion_tokens: 464,
                top_p: 1,
            };

            req.messages.push({
                role: 'user',
                content: prompts,
            });

            const completion = await this.openAIClient.chat.completions.create(req);
            this.logger.info('Response generated');

            return (
                completion.choices[0].message.content?.trim() ??
                'ih carai, deu erro aqui, foi mal.'
            );
        } catch (error) {
            this.logger.error('Error in generateResponse:', error);
            return 'ih carai, deu erro aqui, foi mal.';
        }
    }
}
