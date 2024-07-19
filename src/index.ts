import { Application } from "./app";
import { mongoClient } from "./infrastructure/mongo";
import { openaiClient } from "./infrastructure/openai";
import { wwebClient } from "./application/wweb";
import { Server } from "./server";

const app = new Application(mongoClient!, openaiClient, wwebClient);
const server = new Server(app);

app.initialize();
server.start();
