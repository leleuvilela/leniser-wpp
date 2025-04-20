import { Contact } from '../dtos/contact';

export interface IContactsRepository {
    getContacts(): Promise<Contact[]>;
    updateContacts(contacts: Contact[]): Promise<void>;
}
