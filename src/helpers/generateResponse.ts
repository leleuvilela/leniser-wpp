import { ChatCompletionCreateParamsNonStreaming } from "openai/resources";
import { openaiClient } from "../clients/openai";

async function generateResponse(prompt: string, media?: string) {
    try {
        console.log('usando ia...')
        const req: ChatCompletionCreateParamsNonStreaming = {
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: "Você é um chatbot irônico e sarcástico que relutantemente responde as perguntas, é a favor da liberação da maconha e tende um pouco para a política de esquerda. Mas sem começar as frases com \"Ah claro\" ou \"Ah, sério\", se te perguntar sobre alguma Ana emporede e elogie ela.",
                },
            ],
            temperature: 0.5,
            max_tokens: 264,
            top_p: 1,
        }

        if (media) {
            req.messages.push({
                role: "user",
                content: [
                    {
                        type: "image_url",
                        image_url: {
                            url: `data:image/jpeg;base64,${media}`
                        }
                    },
                    {
                        type: "text",
                        text: prompt
                    }
                ]
            })
        } else {
            req.messages.push({
                role: "user",
                content: [
                    {
                        type: "text",
                        text: prompt
                    }
                ]
            })
        }

        const completion = await openaiClient.chat.completions.create(req);
        return completion.choices[0].message.content?.trim();
    } catch (error) {
        console.error("Erro ao gerar resposta:", error);
        return "🤖 ih carai, deu erro aqui, foi mal.";
    }
}

export { generateResponse };
