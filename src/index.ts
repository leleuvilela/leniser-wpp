import { Application } from "./app";
import { mongoClient } from "./lib/mongo";
import { openaiClient } from "./lib/openai";
import { wwebClient } from "./lib/wweb";
import { Server } from "./server";

const app = new Application(mongoClient, openaiClient, wwebClient);
const server = new Server(app);

app.initialize();
server.start();
