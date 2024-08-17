import { inject, injectable } from 'inversify';
import { TYPES } from '../../ioc/types';
import { MongoClient } from 'mongodb';
import { IMembersRepository } from '../../application/contracts/INumberPermissionsRepository';
import { MemberPermission, Member, MemberConfigs } from '../../application/dtos/members';
import { Logger } from 'winston';

interface MembersDocument {
    id: string;
    desc: string;
    permissions: MemberPermission[];
    configs: MemberConfigs;
}

@injectable()
export class MembersRepository implements IMembersRepository {
    @inject(TYPES.MongoClient) mongoClient: MongoClient;
    @inject(TYPES.Logger) logger: Logger;

    private members = new Map<string, Member>();

    public async getAll(): Promise<Map<string, Member>> {
        if (this.members) {
            return this.members;
        }

        return await this.fetchAll();
    }

    public async find(id: string): Promise<Member | null> {
        const member = this.members.get(id);

        if (member) {
            return member;
        }

        const collection = this.mongoClient
            .db('rap')
            .collection<MembersDocument>('members');

        const result = await collection.findOne({ id });
        this.logger.info('Member Fetched', id);

        if (!result) {
            return null;
        }

        const memberResult = {
            id: result.id,
            desc: result.desc,
            permissions: result.permissions,
            configs: result.configs,
        };

        this.members.set(id, memberResult);

        return memberResult;
    }

    public async fetchAll(): Promise<Map<string, Member>> {
        const collection = this.mongoClient
            .db('rap')
            .collection<MembersDocument>('members');

        const results = await collection.find().toArray();
        this.logger.info('Members Fetched');

        results.forEach((result) => {
            this.members.set(result.id, {
                id: result.id,
                desc: result.desc,
                permissions: result.permissions,
                configs: result.configs,
            });
        });

        return this.members;
    }

    public async create(member: Member): Promise<void> {
        const collection = this.mongoClient
            .db('rap')
            .collection<MembersDocument>('members');

        await collection.insertOne({
            id: member.id,
            desc: member.desc,
            permissions: member.permissions,
            configs: member.configs,
        });
        this.logger.info('Member Created', member.id);

        this.members.set(member.id, member);
    }
}
