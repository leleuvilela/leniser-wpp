import OpenAI from 'openai';
import 'dotenv/config';

//TODO: create a class and mock
const openaiClient = new OpenAI({
    apiKey: process.env.API_GPT,
});

export { openaiClient };
