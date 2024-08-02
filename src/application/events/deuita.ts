import { Message } from 'whatsapp-web.js';
import { IHandler } from '../contracts/IHandler';
import { injectable } from 'inversify';
import { Member, MemberPermission } from '../dtos/members';
import { hasPermissions } from '../../utils/hasPermissions';

@injectable()
export class DeuitaHandler implements IHandler {
    canHandle(msg: Message, member: Member | null): boolean {
        if (msg.body.startsWith('🤖') || !msg.body.toLowerCase().includes('deuita')) {
            return false;
        }

        return hasPermissions(member, [MemberPermission.MESSAGE_CREATE], msg);
    }

    handle(msg: Message): Promise<Message> {
        return msg.reply('🤖 pau no cu do deuita');
    }
}
