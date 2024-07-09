import { wwebClient } from "../clients/wweb";

import { shouldRevokeMessages } from "../helpers/messageFilter";

wwebClient.on('message_revoke_everyone', async (after, before) => {

    if (!shouldRevokeMessages(after)) {
        return;
    }

    if (before && before.type === 'chat') {
        wwebClient.sendMessage(after.from, `🤖 apagou mensagem né safado? @${before.author?.split('@')[0]} \n _${before.body}_`, { mentions: [before.author] })
    }
});
