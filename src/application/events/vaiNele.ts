import { injectable } from 'inversify';
import { type Message, Poll } from 'whatsapp-web.js';
import { IHandler } from '../contracts/IHandler';
import { Member, MemberPermission } from '../dtos/members';
import { hasPermissions } from '../../utils/hasPermissions';

@injectable()
export class VaiNeleHandler implements IHandler {
    public command = '!vainele';

    canHandle(msg: Message, member: Member | null): boolean {
        if (!msg.body.startsWith(this.command)) {
            return false;
        }

        return hasPermissions(member, [MemberPermission.MESSAGE_CREATE], msg);
    }

    async handle(msg: Message): Promise<Message> {
        return msg.reply(new Poll(`Vai nele? 🤔`, ['Sim', 'Não', 'Tal tal']));
    }
}
