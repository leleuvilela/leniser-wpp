import { ChatCompletionCreateParamsNonStreaming } from "openai/resources";
import { mongoClient } from "../clients/mongo";
import { openaiClient } from "../clients/openai";
import { wwapwebClient } from "../clients/wwapweb";
import { MessageMedia, Poll } from "whatsapp-web.js";
import { screenshot } from "../helpers/screenshot";
import { generateAudio } from "../helpers/generateAudio";
import { generateImage } from "../helpers/generateImage";
import { createCooldownFunction } from "../helpers/createCooldown";

const idGrupoLenise = '556285359995-1486844624@g.us'
const idGrupoLeniseGames = '556299031117-1523720875@g.us'
const idGrupoTeste = '120363311991674552@g.us';
const idPedroGilso = '556283282310@c.us';

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

    if (msg.author === idPedroGilso && Math.random() < 0.15) {
        msg.reply('🤖 vai toma no cu Dr. Pedro Gibson');
    }

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
        msg.reply('🤖 cala a boca seu corrupto')
    } else if (messageBody.startsWith('!bot')) {
        if (msg.hasMedia && msg.type === 'image') {
            const media = await msg.downloadMedia();
            const res = await generateResponse(msg.body, media.data)
            msg.reply(`🤖 ${res}`)
        } else {
            const res = await generateResponse(msg.body)
            msg.reply(`🤖 ${res}`)
        }
    } else if (msg.body === '!ranking') {
        const image = await screenshot("https://charts.mongodb.com/charts-lenise-adlmoim/embed/charts?id=667f1af7-ccaf-437c-876a-c98c6f457ee5&maxDataAge=3600&theme=dark&autoRefresh=true")
        const imageBase64 = Buffer.from(image).toString('base64');
        wwapwebClient.sendMessage(msg.from, new MessageMedia('image/jpeg', imageBase64))
    } else if (msg.body.startsWith('!fala')) {
        const textArray = msg.body.split(' ');
        textArray.shift();
        const text = textArray.join(" ")

        try {
            const audio = await generateAudio(text)
            const audioBase64 = Buffer.from(audio).toString('base64')
            wwapwebClient.sendMessage(msg.from, new MessageMedia('audio/mpeg', audioBase64));
        } catch {
            msg.reply('🤖 Calma lá calabreso, isso aí não pode não.')
        }
    } else if (msg.body.startsWith('!imagem')) {
        const textArray = msg.body.split(' ');
        textArray.shift();
        const text = textArray.join(" ")

        try {
            const generateImageCd = createCooldownFunction(generateImage, 60);
            const imageRes = await generateImageCd(text);

            if (!imageRes) {
                msg.reply('🤖 Pera aí, tá em cooldown...')
                return;
            }

            const imageBase64 = imageRes.data[0]?.b64_json;
            wwapwebClient.sendMessage(msg.from, new MessageMedia('image/jpeg', imageBase64))
        } catch {
            msg.reply('🤖 Calma lá calabreso, isso aí não pode não.')
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

