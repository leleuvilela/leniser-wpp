import { type Message } from "whatsapp-web.js";
import { Listener } from "./listener";

//TODO: REMOVE THIS SHIT
const idGrupoLenise = '556285359995-1486844624@g.us';
const idGrupoLeniseGames = '556299031117-1523720875@g.us';
const idGrupoTeste = '120363311991674552@g.us';

const allowedNumbersToProcessMessages = [
    idGrupoLenise,
    idGrupoLeniseGames,
    idGrupoTeste,
];

class MessageRevokeListener extends Listener {
    public static inject = ['wwebClient'] as const;

    public async initialize() {
        this.wwebClient.on('message_revoke_everyone', async (after, before) => {
            //TODO: get ids from mongo and check if the message is from a valid group
            if (!this.shouldProcessMessage(after)) {
                return;
            }

            if (before && before.type === 'chat') {
                this.wwebClient.sendMessage(
                    after.from,
                    `🤖 apagou mensagem né safado? @${before.author?.split('@')[0]} \n _${before.body}_`,
                    { mentions: before.author ? [before.author] : undefined }
                );
            }
        });
    }

    private shouldProcessMessage(msg: Message): boolean {
        //TODO: get ids from mongo and check if the message is from a valid group
        if (allowedNumbersToProcessMessages.includes(msg.from)) {
            return true;
        }

        return false;
    }
}

export { MessageRevokeListener };
