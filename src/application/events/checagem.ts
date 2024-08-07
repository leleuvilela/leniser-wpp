import { injectable } from 'inversify';
import { type Message, Poll } from 'whatsapp-web.js';
import { IHandler } from '../contracts/IHandler';
import { Member, MemberPermission } from '../dtos/members';
import { hasPermissions } from '../../utils/hasPermissions';

@injectable()
export class ChacagemHandler implements IHandler {
    public command = '!checagem';

    canHandle(msg: Message, member: Member | null): boolean {
        if (!msg.body.startsWith(this.command)) {
            return false;
        }

        return hasPermissions(member, [MemberPermission.MESSAGE_CREATE], msg);
    }

    async handle(msg: Message): Promise<Message> {
        return msg.reply(
            new Poll(`🍆🍆🍆 CHECAGEM DA PEÇA NO GRUPO 🍆🍆🍆`, [
                'MOLE',
                'MEIA BOMBA',
                'DURA',
                'TOMEI UM TADALA',
            ])
        );
    }
}
