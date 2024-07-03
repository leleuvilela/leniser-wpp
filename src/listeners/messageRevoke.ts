import { wwebClient } from "../clients/wweb";

const idGrupoLenise = '556285359995-1486844624@g.us'
const idGrupoLeniseGames = '556299031117-1523720875@g.us'
const idGrupoTeste = '120363311991674552@g.us';

wwebClient.on('message_revoke_everyone', async (after, before) => {

    if (after.from !== idGrupoLenise && after.from !== idGrupoLeniseGames && after.from !== idGrupoTeste) { //TODO: remove when get a new botnumber
        return;
    }

    if (before && before.type === 'chat') {
        wwebClient.sendMessage(after.from, `🤖 apagou mensagem né safado? @${before.author?.split('@')[0]} \n _${before.body}_`, { mentions: [before.author] })
    }
});
