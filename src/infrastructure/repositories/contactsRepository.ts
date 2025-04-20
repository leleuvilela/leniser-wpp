import 'dotenv/config';
import { inject, injectable } from 'inversify';
import { IContactsRepository } from '../../application/contracts/IContactsRepository';
import { TYPES } from '../../ioc/types';
import { MongoClient } from 'mongodb';
import { Logger } from 'winston';
import { Contact } from '../../application/dtos/contact';

@injectable()
export class ContactsRepository implements IContactsRepository {
    @inject(TYPES.MongoClient) mongoClient: MongoClient;
    @inject(TYPES.Logger) logger: Logger;

    async getContacts(): Promise<Contact[]> {
        const collection = this.mongoClient
            .db(process.env.DB_COLLECTION)
            .collection<Contact>('contacts');

        const contacts = await collection.find().toArray();

        if (!contacts) {
            this.logger.error('No contacts found');
            return [];
        }

        this.logger.info('Contacts Fetched');

        return contacts;
    }

    async updateContacts(contacts: Contact[]): Promise<void> {
        const collection = this.mongoClient
            .db(process.env.DB_COLLECTION)
            .collection<Contact>('contacts');

        await collection.deleteMany({});

        await collection.insertMany(contacts);

        this.logger.info('Contacts Updated');
    }
}
