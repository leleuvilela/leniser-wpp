import { injectable, inject } from 'inversify';
import { type Client, type Message } from 'whatsapp-web.js';
import { TYPES } from '../../ioc/types';
import { IHandler } from '../contracts/IHandler';
import { IContactsRepository } from '../contracts/IContactsRepository';

@injectable()
export class ContatosHandler implements IHandler {
    @inject(TYPES.WwebClient) wappClient: Client;
    @inject(TYPES.ContactsRepository) contactsRepository: IContactsRepository;

    public command = '!contatos';

    canHandle(msg: Message): boolean {
        return msg.body.startsWith(this.command);
    }

    async handle(msg: Message): Promise<Message> {
        const contactsString = msg.body.replace(this.command, '').trim();
        const contacts = contactsString
            .split(/\r?\n|\r|\n/g)
            .map((contact) => contact.trim().split(','));

        console.log('contacts', contacts);

        const contactsMap = contacts.map((contact) => {
            return {
                name: contact[0],
                phone: contact[1],
            };
        });

        await this.contactsRepository.updateContacts(contactsMap);

        return msg.reply(`🤖 contatos atualizados!`);
    }
}
