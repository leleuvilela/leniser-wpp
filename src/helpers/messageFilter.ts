import WAWebJS from "whatsapp-web.js";

const idGrupoLenise = '556285359995-1486844624@g.us'
const idGrupoLeniseGames = '556299031117-1523720875@g.us'
const idGrupoTeste = '120363311991674552@g.us';
const idPedroGilso = '556283282310@c.us';

const allowedNumbersToProcessMessages = [
    idGrupoLenise,
    idGrupoLeniseGames,
    idGrupoTeste
]

const allowedNumbersToRevokeMessages = [
    idGrupoLenise,
    idGrupoLeniseGames,
    idGrupoTeste
]

function shouldProcessMessage(msg: WAWebJS.Message): boolean {
    return allowedNumbersToProcessMessages.includes(msg.from)
}

function shouldRevokeMessages(msg: WAWebJS.Message): boolean {
    return allowedNumbersToRevokeMessages.includes(msg.from)
}

export {
    shouldProcessMessage,
    shouldRevokeMessages,
    idGrupoLenise,
    idGrupoLeniseGames,
    idGrupoTeste,
    idPedroGilso
};
