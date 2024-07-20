import { OpenAI } from "openai";
import { IResponseService } from "../../application/contracts/IResponseService";
import {
    type ChatCompletionCreateParamsNonStreaming,
    type ChatCompletionContentPart
} from "openai/resources";

export class ResponseService implements IResponseService {

    private openAIClient: OpenAI

    public static inject = ['openAIClient'] as const;

    constructor(openAIClient: OpenAI) {
        this.openAIClient = openAIClient;
    }

    async generateResponse(systemRoleMessage: string, prompts: ChatCompletionContentPart[]): Promise<string> {

        try {
            const req: ChatCompletionCreateParamsNonStreaming = {
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: systemRoleMessage
                    },
                ],
                temperature: 0.5,
                max_tokens: 264,
                top_p: 1,
            };

            req.messages.push({
                role: "user",
                content: prompts
            });

            const completion = await this.openAIClient.chat.completions.create(req);
            return completion.choices[0].message.content?.trim() ?? "ih carai, deu erro aqui, foi mal.";

        } catch (error) {
            console.error("Erro ao gerar resposta:", error);
            return "ih carai, deu erro aqui, foi mal.";
        }
    }

}
