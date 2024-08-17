import { inject, injectable } from 'inversify';
import { TYPES } from '../../ioc/types';
import { MongoClient } from 'mongodb';
import { GroupMembers } from '../../application/dtos/groupMembers';
import { IGroupMembersRepository } from '../../application/contracts/IGroupMembersRepository';
import { Logger } from 'winston';

export interface MembersDocument {
    id: string;
    members: Record<string, string>;
}

@injectable()
export class GroupMembersRepository implements IGroupMembersRepository {
    @inject(TYPES.MongoClient) mongoClient: MongoClient;
    @inject(TYPES.Logger) logger: Logger;

    public async getMembers(groupId: string): Promise<GroupMembers | null> {
        const collection = this.mongoClient
            .db('rap')
            .collection<MembersDocument>('group_members');

        const result = await collection.findOne({ id: groupId });
        this.logger.info('GroupMembers Fetched');

        if (!result) {
            return null;
        }

        return {
            group_id: result.id,
            members: result.members,
        };
    }
}
