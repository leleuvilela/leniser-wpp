import { ChatCompletionContentPart } from "openai/resources";

export interface IResponseService {
    generateResponse: (systemRoleMessage: string, prompts: ChatCompletionContentPart[]) => Promise<string>;
}

