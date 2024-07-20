import { Application } from "./app";
import { wwebClient } from "./application/wweb";
import { createInjector } from 'typed-inject';
import { Server } from "./server";
import { MongoClient, ServerApiVersion } from "mongodb";
import { OpenAI } from "openai";

import { MessageRepository } from "./infrastructure/repositories/messagesRepository";

import { AuthenticationListener } from "./application/listeners/authentication";
import { MessageCreateListener } from "./application/listeners/messageCreate";
import { MessageRevokeListener } from "./application/listeners/messageRevoke";

import { ResponseService } from "./infrastructure/openAi/responseService";
import { AudioService } from "./infrastructure/openAi/audioService";

import { BotHandler } from "./application/events/bot";
import { FalaHandler } from "./application/events/fala";
import { RankingHandler } from "./application/events/ranking";

// TODO: convert it to class
import {
    handleImagem,
    handleRankingImage,
    handleTranscrever,
} from "./application/events";

// TODO: make it optional as well
const openaiClient = new OpenAI({
    apiKey: process.env.API_GPT,
});

const appInjector = createInjector()
    .provideFactory('mongoClient', () => {
        const dbUri = process.env.DB_URI;

        if (!dbUri) return null;

        return new MongoClient(dbUri, {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            }
        });
    })
    .provideValue("openAIClient", openaiClient)
    .provideValue("wwebClient", wwebClient)
    .provideClass("authenticationListener", AuthenticationListener)
//repositories
    .provideClass("messageRepository", MessageRepository)
//services
    .provideClass("responseService", ResponseService)
    .provideClass("audioService", AudioService)
//handlers
    .provideClass("botHandler", BotHandler)
    .provideClass("falaHandler", FalaHandler)
    .provideClass("rankingHandler", RankingHandler)
//listeners
    .provideClass("messageRevokeListener", MessageRevokeListener)
    .provideClass("messageCreateListener", MessageCreateListener)

const app = appInjector.injectClass(Application)
const server = new Server(app);

app.initialize();
server.start();
