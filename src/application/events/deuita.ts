import { Message } from 'whatsapp-web.js';
import { IHandler } from '../contracts/IHandler';
import { injectable } from 'inversify';
import { Member, MemberPermission } from '../dtos/members';

@injectable()
export class DeuitaHandler implements IHandler {
    canHandle(msg: Message, member: Member | null): boolean {
        const isAuthorized =
            !!member && member.permissions.includes(MemberPermission.MESSAGE_CREATE);

        return (
            isAuthorized &&
            !msg.body.startsWith('🤖') &&
            msg.body.toLowerCase().includes('deuita')
        );
    }

    handle(msg: Message): Promise<Message> {
        return msg.reply('🤖 pau no cu do deuita');
    }
}
