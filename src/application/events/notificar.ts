import { injectable, inject } from 'inversify';
import { type Client, type Message } from 'whatsapp-web.js';
import { TYPES } from '../../ioc/types';
import { IHandler } from '../contracts/IHandler';
import { IContactsRepository } from '../contracts/IContactsRepository';

@injectable()
export class NotificarHandler implements IHandler {
    @inject(TYPES.ContactsRepository) contactsRepository: IContactsRepository;
    @inject(TYPES.WwebClient) wappClient: Client;

    public command = '!notificar';

    canHandle(msg: Message): boolean {
        return msg.body.startsWith(this.command);
    }

    async handle(msg: Message): Promise<Message> {
        const message = msg.body.replace(this.command, '').trim();

        const contacts = await this.contactsRepository.getContacts();

        for (const contact of contacts) {
            const messageToSend = message.replace('{name}', contact.name);
            this.wappClient.sendMessage(`${contact.phone}@c.us`, messageToSend);
        }

        return msg;
    }
}
