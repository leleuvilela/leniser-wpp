import { ChatCompletionCreateParamsNonStreaming } from "openai/resources";
import { mongoClient } from "../clients/mongo";
import { openaiClient } from "../clients/openai";
import { wwapwebClient } from "../clients/wwapweb";
import { Poll } from "whatsapp-web.js";

const idGrupoLenise = '556285359995-1486844624@g.us'
const idGrupoLeniseGames = '556299031117-1523720875@g.us'
const idGrupoTeste = '120363311991674552@g.us';

async function generateResponse(prompt: string, media?: string) {
    try {
        console.log('usando ia...')
        const req: ChatCompletionCreateParamsNonStreaming = {
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: "Você é um chatbot irônico e sarcástico que relutantemente responde as perguntas, é a favor da liberação da maconha e tende um pouco para a política de esquerda, você também sempre ressaltar o quão chato o membro do grupo Pedro Gibson é. Mas sem começar as frases com \"Ah claro\" ou \"Ah, sério\"",
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

wwapwebClient.on('message', async msg => {

    if (msg.from !== idGrupoLenise && msg.from !== idGrupoLeniseGames && msg.from !== idGrupoTeste) { //TODO: remove when get a new botnumber
        return;
    }

    const messageBody = msg.body.toLowerCase();

    if (messageBody === '!ping') {
        msg.reply('🤖 pong');
    } else if (messageBody === '!checagem') {
        wwapwebClient.sendMessage(msg.from, new Poll(`🍆🍆🍆 CHECAGEM DA PEÇA NO GRUPO 🍆🍆🍆`, ['MOLE', 'MEIA BOMBA', 'DURA', 'TOMEI UM TADALA']))
    } else if (messageBody === '!jaque') {
        msg.reply('🤖 Meu nome é Jaqueline, tenho 15 anos e já transo')
    } else if (messageBody.includes('jaoq')) {
        msg.reply('queline')
    } else if (messageBody.includes('deuita')) {
        msg.reply('🤖 vai toma no cu')
    } else if (messageBody.includes('gibson')) {
        msg.reply('cala a boca seu corrupto')
    } else if (messageBody.startsWith('!bot')) {
        if (msg.hasMedia && msg.type === 'image') {
            const media = await msg.downloadMedia();
            const res = await generateResponse(msg.body, media.data)
            msg.reply(`🤖 ${res}`)
        } else {
            const res = await generateResponse(msg.body)
            msg.reply(`🤖 ${res}`)
        }
    }

    try {
        if (msg.from === idGrupoLenise) {
            await mongoClient.db("rap").collection("messages").insertOne(msg)
        }
    } catch {
        console.log("MONGO: error to add message to collections in mongo")
    }

});

