import { mongoClient } from "../clients/mongo";
import { wwebClient } from "../clients/wweb";
import { shouldProcessMessage, idPedroGilso, idGrupoLenise } from "../helpers/messageFilter";

wwebClient.on('message', async msg => {

    const messageBody = msg.body.toLowerCase();

    if (!shouldProcessMessage(msg)) {
        return;
    }

    if (msg.author === idPedroGilso && Math.random() < 0.15) {
        msg.reply('🤖 cala a boca seu corrupto')
    }

    if (messageBody.includes('deuita')) {
        msg.reply('🤖 vai toma no cu')
    }

    try {
        if (msg.from === idGrupoLenise) {
            await mongoClient.db("rap").collection("messages").insertOne(msg)
        }
    } catch {
        console.log("MONGO: error to add message to collections in mongo")
    }

});
