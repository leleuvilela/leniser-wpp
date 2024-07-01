import { wwapwebClient } from "../clients/wwapweb";

wwapwebClient.on('message_revoke_everyone', async (after, before) => {
    // Fired whenever a message is deleted by anyone (including you)
    if (before && before.type === 'chat') {
        wwapwebClient.sendMessage(after.from, `🤖 apagou mensagem né safado? @${before.author?.split('@')[0]} \n _${before.body}_`, { mentions: [before.author] })
    }
});
