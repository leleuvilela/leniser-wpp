import { ResponseInput } from 'openai/resources/responses/responses';

export interface IResponseService {
    generateResponse: (
        systemRoleMessage: string,
        prompts: string | ResponseInput
    ) => Promise<string>;
}
