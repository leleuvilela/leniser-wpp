import { injectable } from 'inversify';
import { type Message, Poll } from 'whatsapp-web.js';
import { IHandler } from '../contracts/IHandler';
import { Member, MemberPermission } from '../dtos/members';

@injectable()
export class ChacagemHandler implements IHandler {
    public command = '!checagem';

    canHandle(msg: Message, member: Member | null): boolean {
        const isAuthorized =
            !!member && member.permissions.includes(MemberPermission.MESSAGE_CREATE);

        return isAuthorized && msg.body.startsWith(this.command);
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
