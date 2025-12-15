import { OpenAI } from 'openai';
import { IResponseService } from '../../application/contracts/IResponseService';
import { type ChatCompletionContentPart } from 'openai/resources';
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
            const response = await this.openAIClient.chat.completions.create({
                model: 'gpt-5',
                messages: [
                    {
                        role: 'system',
                        content: systemRoleMessage,
                    },
                    {
                        role: 'user',
                        content: prompts,
                    },
                ],
                max_completion_tokens: 464,
                top_p: 1,
            });

            this.logger.info('Response generated');

            return (
                response.choices[0]?.message?.content?.trim() ??
                'ih carai, deu erro aqui, foi mal.'
            );
        } catch (error) {
            this.logger.error('Error in generateResponse:', error);
            return 'ih carai, deu erro aqui, foi mal.';
        }
    }
}
