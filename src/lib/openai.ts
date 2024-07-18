import OpenAI from "openai";
import 'dotenv/config';

const openaiClient = new OpenAI({
    apiKey: process.env.API_GPT,
});

export { openaiClient };
