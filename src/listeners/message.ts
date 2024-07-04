import { mongoClient } from "../clients/mongo";
import { wwebClient } from "../clients/wweb";

const idGrupoLenise = '556285359995-1486844624@g.us'
const idGrupoLeniseGames = '556299031117-1523720875@g.us'
const idGrupoTeste = '120363311991674552@g.us';
const idPedroGilso = '556283282310@c.us';

wwebClient.on('message', async msg => {

    const messageBody = msg.body.toLowerCase();

    if (msg.from !== idGrupoLenise && msg.from !== idGrupoLeniseGames && msg.from !== idGrupoTeste) { //TODO: remove when get a new botnumber
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
