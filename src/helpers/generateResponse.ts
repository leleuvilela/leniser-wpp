import { ChatCompletionCreateParamsNonStreaming, ChatCompletionContentPart } from "openai/resources";
import { openaiClient } from "../clients/openai";

async function generateResponse(systemRoleMessage: string, prompts: ChatCompletionContentPart[]) {
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
        }

        req.messages.push({
            role: "user",
            content: prompts
        })

        const completion = await openaiClient.chat.completions.create(req);
        return completion.choices[0].message.content?.trim();

    } catch (error) {
        console.error("Erro ao gerar resposta:", error);
        return "🤖 ih carai, deu erro aqui, foi mal.";
    }
}

export { generateResponse };
